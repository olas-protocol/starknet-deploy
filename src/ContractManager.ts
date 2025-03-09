import {
  getChecksumAddress,
  Account,
  RpcProvider,
  CallData,
  stark,
  Contract,
  GetTxReceiptResponseWithoutHelper,
  ReceiptTx,
  Result,
  ArgsOrCalldata,
  RawArgsArray,
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
  constructorArgs?: RawArgsArray;
}
/**
 * Provides methods for deploying and interacting with contracts.
 */
export class ContractManager {
  public provider: RpcProvider;
  public account: Account;

  constructor(rpcEndpoint: string, privateKey: string, accountAddress: string) {
    this.provider = new RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new Account(
      this.provider,
      accountAddress,
      privateKey,
      undefined,
      '0x3',
    );
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

    this.account = new Account(
      this.provider,
      accountAddress,
      privateKey,
      undefined,
      '0x3',
    );
    logInfo(
      `Switched to account index ${accountIndex}. New account address: ${accountAddress}`,
    );
  }
  /**
   * Deploys a contract with the given configuration.
   *
   * @param contractName The name of the contract to be deployed
   * @param constructorArgs Optional constructor arguments for the contract
   * @returns deployed contract address
   * @throws Will throw an error if the deployment fails.
   */

  async deployContract(deploymentConfig: DeploymentConfig): Promise<string> {
    const { contractName, constructorArgs } = deploymentConfig;
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;

    logInfo(
      `Deploying contract: ${contractName}, with initial args: ${JSON.stringify(constructorArgs, replacer, 2)}`,
    );

    try {
      const { sierraCode, casmCode } = await getCompiledCode(
        contractName,
        config,
      );

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
        config.defaultNetwork,
        contractName,
        deployResponse.declare.class_hash,
        deployResponse.deploy.address,
      );
      await saveContractAddress(
        contractName,
        deployResponse.deploy.address,
        currentNetwork,
      );
      return deployResponse.deploy.address;
    } catch (error) {
      logError(
        `Failed to deploy ${contractName} contract  with error: ${error}`,
      );
      throw error;
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

    const { sierraCode } = await getCompiledCode(contractName, config);
    const contract_abi = sierraCode.abi;

    const contract: Contract = new Contract(
      contract_abi,
      contractAddress,
      this.provider,
    );
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
  async getContractByAddress(contractAddress: string): Promise<Contract> {
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

      return contract;
    } catch (error) {
      logError(`Failed to connect to contract at address ${contractAddress}:`);
      throw error;
    }
  }

  /**
   * Checks if a string is a valid Starknet address
   * @param value String to check
   * @returns boolean indicating if the string is a Starknet address
   */
  public isStarknetAddress(value: string): boolean {
    // Starknet addresses are 0x followed by a 64-character hex string
    return /^0x[0-9a-fA-F]{63,64}$/.test(value);
  }

  /**
   * Resolves a contract reference to a Contract instance.
   * @param contractRef Contract instance, contract address string, or contract name
   * @returns Promise resolving to a Contract instance
   * @private
   */
  private async resolveContract(
    contractRef: Contract | string,
  ): Promise<Contract> {
    if (typeof contractRef !== 'string') {
      // It's already a Contract instance
      return contractRef;
    }
    if (this.isStarknetAddress(getChecksumAddress(contractRef))) {
      // It's a contract address
      return await this.getContractByAddress(contractRef);
    } else {
      // It's a contract name
      return await this.getContractInstance(contractRef);
    }
  }

  /**
   * Checks if a function exists on a contract.
   * @param contract - The contract instance to check.
   * @param functionName - The name of the function to check for.
   * @throws An error if the function doesn't exist.
   * @private
   */
  private validateFunctionExists(
    contract: Contract,
    functionName: string,
  ): void {
    if (
      !Object.prototype.hasOwnProperty.call(contract.functions, functionName)
    ) {
      throw new Error(
        `Function '${functionName}' does not exist on the contract at address ${contract.address}`,
      );
    }
  }

  /**
   *  Queries a function on a deployed contract.
   * @param contract Contract name, contract instance, or contract address.
   * @param functionName The name of the function to call on the contract.
   * @param args The arguments for the function.
   * @returns A promise that resolves with the result of the contract function call.
   * @throws Will throw an error if the transaction fails.
   */
  async queryContract(
    contract: Contract | string,
    functionName: string,
    args: ArgsOrCalldata = [],
  ): Promise<Result> {
    const contractInstance = await this.resolveContract(contract);
    this.validateFunctionExists(contractInstance, functionName);

    try {
      const response = await contractInstance.call(functionName, args);
      return response;
    } catch (error) {
      logError(`An error occurred during call of ${functionName} function:`);
      throw error;
    }
  }
  /**
   * Invokes a function on a deployed contract.
   * @param contract Contract name, contract instance, or contract address.
   * @param functionName The name of the function to call on the contract.
   * @param args The arguments for the function.
   * @param bufferPercentage - Optional. The percentage buffer to add to the max fee (default is 20%).
   * @returns A promise that resolves with the transaction receipt.
   * @throws Will throw an error if the transaction fails.
   */
  async invokeContract(
    contract: Contract | string,
    functionName: string,
    args: ArgsOrCalldata = [],
    bufferPercentage: number = 20,
  ): Promise<string> {
    const contractInstance = await this.resolveContract(contract);
    contractInstance.connect(this.account);
    this.validateFunctionExists(contractInstance, functionName);

    // Estimate the fee for the function call
    const maxFee = await this.estimateMaxFee(
      contractInstance,
      functionName,
      args,
      bufferPercentage,
    );
    try {
      // Execute the contract function
      const txResponse = await contractInstance.invoke(functionName, args, {
        maxFee,
      });
      // Wait for the transaction to be mined
      const txReceipt = await this.provider.waitForTransaction(
        txResponse.transaction_hash,
      );
      this.handleTxReceipt(txReceipt, functionName);

      return txResponse.transaction_hash;
    } catch (error) {
      logError(
        `An error occurred during execution of ${functionName} function`,
      );
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
    args: ArgsOrCalldata = [],
    bufferPercentage: number,
  ): Promise<bigint> {
    const feeEstimate = await contract.estimate(functionName, args);
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
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    receiptTx.match({
      success: (successReceipt) => {
        logSuccess(
          `${operationName} transaction succeeded\nExplorer URL: ${getExplorerUrl(currentNetwork, successReceipt.transaction_hash)}`,
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
    const missingValues = [];
    if (!rpcEndpoint) missingValues.push('rpcUrl');
    if (!privateKey) missingValues.push('accounts[0]');
    if (!accountAddress) missingValues.push('addresses[0]');

    throw new Error(
      `Missing required network configuration values for "${currentNetwork}": ${missingValues.join(', ')}. ` +
        `Please check your starknet-deploy config file and ensure all required fields are provided.`,
    );
  }

  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};
