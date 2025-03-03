import {
  Account,
  RpcProvider,
  CallData,
  stark,
  Contract,
  GetTxReceiptResponseWithoutHelper,
  ReceiptTx,
} from 'starknet';
import {
  getCompiledCode,
  saveContractAddress,
  fetchContractAddress,
  loadConfigFile,
} from './fileUtils';
import { logError, logInfo, logSuccess, logDeploymentDetails } from './logger';
import { getExplorerUrl, handleError, replacer } from './common';

interface DeploymentConfig {
  contractName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs?: Record<string, any>;
}
/**
 * Provides methods for deploying and interacting with contracts.
 */
export class ContractManager {
  public provider: RpcProvider;
  public account: Account;

  constructor(rpcEndpoint: string, privateKey: string, accountAddress: string) {
    this.provider = new RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new Account(this.provider, accountAddress, privateKey);
  }

  /**
   * Updates the account used for contract deployment and interaction.
   * @param accountOrIndex The account object or index of the account in the configuration.
   */
  async updateAccount(accountOrIndex: Account | number): Promise<void> {
    if (accountOrIndex instanceof Account) {
      // If an Account object is provided, set it directly
      this.account = accountOrIndex;
      logInfo(`Switched to account with address: ${accountOrIndex.address}`);
      return;
    }
    // Handle account index case
    const accountIndex = accountOrIndex;
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    const networkConfig = config.networks[currentNetwork];

    if (!networkConfig) {
      throw new Error(
        `Network configuration not found for network: ${currentNetwork}`,
      );
    }

    if (accountIndex < 0 || accountIndex >= networkConfig.accounts.length) {
      throw new Error(`Invalid account index provided: ${accountIndex}`);
    }

    const privateKey = networkConfig.accounts[accountIndex];
    const accountAddress = networkConfig.addresses[accountIndex];

    if (!privateKey) {
      throw new Error(
        `Private key not found for account index: ${accountIndex}`,
      );
    }
    if (!accountAddress) {
      throw new Error(
        `Account address not found for account index: ${accountIndex}`,
      );
    }

    this.account = new Account(this.provider, accountAddress, privateKey);
    logInfo(
      `Switched to account index ${accountIndex}. New account address: ${accountAddress}`,
    );
  }
  /**
   * Deploys a contract with the given configuration.
   *
   * @param contractName The name of the contract to be deployed
   * @param constructorArgs Optional constructor arguments for the contract
   * @returns A promise that resolves when the deployment is complete.
   * @throws Will throw an error if the deployment fails.
   */

  async deployContract(deploymentConfig: DeploymentConfig): Promise<void> {
    const { contractName, constructorArgs } = deploymentConfig;
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;

    logInfo(
      `Deploying contract: ${contractName}, with initial args: ${JSON.stringify(constructorArgs, replacer, 2)}`,
    );

    try {
      const { sierraCode, casmCode } = await getCompiledCode(contractName);

      let constructorCalldata;
      if (constructorArgs) {
        const callData = new CallData(sierraCode.abi);
        constructorCalldata = callData.compile('constructor', constructorArgs);
      }

      const deployResponse = await this.account.declareAndDeploy({
        contract: sierraCode,
        casm: casmCode,
        constructorCalldata,
        salt: stark.randomAddress(),
      });

      logDeploymentDetails(
        contractName,
        deployResponse.declare.class_hash,
        deployResponse.deploy.address,
      );
      await saveContractAddress(
        contractName,
        deployResponse.deploy.address,
        currentNetwork,
      );
    } catch (error) {
      logError(`Failed to deploy ${contractName} contract`);
      console.error(error);
      process.exit(1);
    }
  }
  /**
   * Retrieves an instance of a deployed local contract.
   * @param contractName The name of the contract to be deployed.
   * @returns The deployed contract instance.
   *
   */
  async getContractInstance(contractName: string): Promise<Contract> {
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    const contractAddress = await fetchContractAddress(
      contractName,
      currentNetwork,
    );

    if (!contractAddress) {
      throw new Error(`Contract address for ${contractName} not found`);
    }

    const { sierraCode } = await getCompiledCode(contractName);
    const contract_abi = sierraCode.abi;

    const contract: Contract = new Contract(
      contract_abi,
      contractAddress,
      this.provider,
    );
    // Connect the contract to the account for signing transactions
    contract.connect(this.account);
    logSuccess(
      `Connected to ${contractName} contract with address ${this.account.address}`,
    );
    return contract;
  }
  /**
   * Connects to a deployed contract by fetching its ABI from the network.
   * @param contractAddress The address of the deployed contract.
   * @returns A connected Contract instance.
   */
  async connectToDeployedContract(contractAddress: string): Promise<Contract> {
    try {
      // Fetch the contract class at the given address
      const { abi: contractAbi } =
        await this.provider.getClassAt(contractAddress);

      if (!contractAbi) {
        throw new Error(
          `No ABI found for contract at address ${contractAddress}`,
        );
      }

      // Create a new Contract instance with the ABI and address
      const contract = new Contract(
        contractAbi,
        contractAddress,
        this.provider,
      );

      // Connect the contract to the account for signing transactions
      contract.connect(this.account);

      return contract;
    } catch (error) {
      logError(`Failed to connect to contract at address ${contractAddress}:`);
      throw error;
    }
  }
  /**
   * Executes a function on a deployed contract.
   * @param contract Contract instance or contract address.
   * @param functionName The name of the function to call on the contract.
   * @param args The arguments for the function.
   * @param bufferPercentage - Optional. The percentage buffer to add to the max fee (default is 20%).
   * @returns A promise that resolves with the transaction receipt.
   * @throws Will throw an error if the transaction fails.
   */
  async executeTransaction(
    contract: Contract | string,
    functionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[] = [],
    bufferPercentage: number = 20,
  ): Promise<string> {
    let contractInstance: Contract;
    // Determine if contract is an instance or an address
    if (typeof contract === 'string') {
      // It's a contract address, connect to the deployed contract
      contractInstance = await this.connectToDeployedContract(contract);
    } else {
      contractInstance = contract;
    }

    // Estimate the fee for the function call
    const maxFee = await this.estimateMaxFee(
      contractInstance,
      functionName,
      args,
      bufferPercentage,
    );
    try {
      // Execute the contract function
      // @ts-expect-error - TODO: Fix this
      const txResponse = await contractInstance.functions[functionName](
        ...args,
        { maxFee },
      );
      // Wait for the transaction to be mined
      const txReceipt = await this.provider.waitForTransaction(
        txResponse.transaction_hash,
      );
      this.handleTxReceipt(txReceipt, functionName);

      return txResponse.transaction_hash;
    } catch (error) {
      logError(
        `An error occurred during ${functionName} execution of ${functionName} function:`,
      );
      console.error(error);
      throw error;
    }
  }

  /**
   * Estimates the maximum fee required for a Starknet transaction.
   * @param contract - The Starknet contract instance.
   * @param functionName - The name of the function to estimate the fee for.
   * @param functionArgs - The arguments to pass to the function.
   * @param bufferPercentage - The percentage buffer to add to the suggested max fee.
   * @returns The multiplied suggested max fee.
   */
  async estimateMaxFee(
    contract: Contract,
    functionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    functionArgs: any[],
    bufferPercentage: number,
  ): Promise<bigint> {
    // @ts-expect-error - TODO: Fix this
    const feeEstimate = await contract.estimateFee[functionName](
      ...functionArgs,
    );
    const suggestedMaxFee = BigInt(feeEstimate.suggestedMaxFee);
    const maxFee =
      (suggestedMaxFee * BigInt(100 + bufferPercentage)) / BigInt(100);
    logInfo(
      `Suggested max fee for ${functionName}: ${suggestedMaxFee}, Max fee with buffer: ${maxFee}`,
    );
    return maxFee;
  }

  // Helper function to handle transaction receipt
  async handleTxReceipt(
    receipt: GetTxReceiptResponseWithoutHelper,
    operationName: string,
  ): Promise<void> {
    const receiptTx = new ReceiptTx(receipt);

    receiptTx.match({
      success: (successReceipt) => {
        logSuccess(
          `${operationName} transaction succeeded\nExplorer URL: ${getExplorerUrl(successReceipt.transaction_hash)}`,
        );
      },
      reverted: (revertedReceipt) => {
        const message = `${operationName} transaction reverted: ${revertedReceipt.revert_reason}`;
        handleError(message);
      },
      rejected: (rejectedReceipt) => {
        const message = `${operationName} transaction rejected with status: ${rejectedReceipt.status}`;
        handleError(message);
      },
      _: () => {
        const message = `${operationName} transaction failed with unknown error`;
        handleError(message);
      },
    });
  }
}
/**
 * Initializes a new Contract Manager  instance using environment variables.
 *
 * @returns A new Contract Manager instance.
 * @throws Will throw an error if required environment variables are missing.
 */
export const initializeContractManager = async (): Promise<ContractManager> => {
  const config = await loadConfigFile();
  const currentNetwork = config.defaultNetwork;
  const networkConfig = config.networks[currentNetwork];

  if (!networkConfig) {
    logError(`No configuration found for network: ${currentNetwork}`);
    throw new Error();
  }

  const rpcEndpoint = networkConfig.rpcUrl;
  const privateKey = networkConfig.accounts[0];
  const accountAddress = networkConfig.addresses[0];

  if (!rpcEndpoint || !privateKey || !accountAddress) {
    throw new Error('Missing required network configuration values');
  }

  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};
