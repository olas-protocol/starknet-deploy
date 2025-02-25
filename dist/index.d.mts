import {
  RpcProvider,
  Account,
  Contract,
  GetTxReceiptResponseWithoutHelper,
} from 'starknet';

interface DeploymentConfig {
  contractName: string;
  constructorArgs?: Record<string, any>;
}
/**
 * Provides methods for deploying and interacting with contracts.
 */
declare class ContractManager {
  provider: RpcProvider;
  account: Account;
  constructor(rpcEndpoint: string, privateKey: string, accountAddress: string);
  /**
   * Deploys a contract with the given configuration.
   *
   * @param contractName The name of the contract to be deployed
   * @param constructorArgs Optional constructor arguments for the contract
   * @returns A promise that resolves when the deployment is complete.
   * @throws Will throw an error if the deployment fails.
   */
  deployContract(config: DeploymentConfig): Promise<void>;
  /**
   * Retrieves an instance of a deployed local contract.
   * @param contractName The name of the contract to be deployed.
   * @returns The deployed contract instance.
   *
   */
  getContractInstance(contractName: string): Promise<Contract>;
  /**
   * Connects to a deployed contract by fetching its ABI from the network.
   * @param contractAddress The address of the deployed contract.
   * @returns A connected Contract instance.
   */
  connectToDeployedContract(contractAddress: string): Promise<Contract>;
  /**
   * Executes a function on a deployed contract.
   * @param contract Contract instance or contract address.
   * @param functionName The name of the function to call on the contract.
   * @param args The arguments for the function.
   * @param bufferPercentage - Optional. The percentage buffer to add to the max fee (default is 20%).
   * @returns A promise that resolves with the transaction receipt.
   * @throws Will throw an error if the transaction fails.
   */
  executeTransaction(
    contract: Contract | string,
    functionName: string,
    args?: any[],
    bufferPercentage?: number,
  ): Promise<string>;
  /**
   * Estimates the maximum fee required for a Starknet transaction.
   * @param contract - The Starknet contract instance.
   * @param functionName - The name of the function to estimate the fee for.
   * @param functionArgs - The arguments to pass to the function.
   * @param bufferPercentage - The percentage buffer to add to the suggested max fee.
   * @returns The multiplied suggested max fee.
   */
  estimateMaxFee(
    contract: Contract,
    functionName: string,
    functionArgs: any[],
    bufferPercentage: number,
  ): Promise<bigint>;
  handleTxReceipt(
    receipt: GetTxReceiptResponseWithoutHelper,
    operationName: string,
  ): Promise<void>;
}
/**
 * Initializes a new Contract Manager  instance using environment variables.
 *
 * @returns A new Contract Manager instance.
 * @throws Will throw an error if required environment variables are missing.
 */
declare const initializeContractManager: () => ContractManager;

export { ContractManager, initializeContractManager };
