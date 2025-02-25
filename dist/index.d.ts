import { RpcProvider, Account, Abi as Abi$1, Contract, GetTxReceiptResponseWithoutHelper } from 'starknet';
import { Abi, ExtractAbiFunctions, FunctionRet, FunctionArgs } from 'abi-wan-kanabi/kanabi';

type AbiStateMutability = 'view' | 'external';
type ExtractFunctionNames<TAbi extends Abi, TStateMutability extends AbiStateMutability> = Extract<ExtractAbiFunctions<TAbi>, {
    state_mutability: TStateMutability;
}>['name'];
type FunctionResponse<TAbi extends Abi, TFunctionName extends ExtractAbiFunctions<TAbi>['name']> = FunctionRet<TAbi, TFunctionName>;

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
    getAbi(contractName: string): Promise<Abi$1>;
    executeTransaciton<TAbi extends Abi$1, TFunctionName extends ExtractFunctionNames<TAbi, 'external'>, TArgs extends FunctionArgs<TAbi, TFunctionName>, TFunctionResponse extends FunctionResponse<TAbi, TFunctionName>>(params: {
        abi: TAbi;
        contract: string;
        functionName: TFunctionName;
        args: TArgs;
        options?: {
            bufferPercentage?: number;
        };
    }): Promise<TFunctionResponse | any>;
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
     * Estimates the maximum fee required for a Starknet transaction.
     * @param contract - The Starknet contract instance.
     * @param functionName - The name of the function to estimate the fee for.
     * @param functionArgs - The arguments to pass to the function.
     * @param bufferPercentage - The percentage buffer to add to the suggested max fee.
     * @returns The multiplied suggested max fee.
     */
    estimateMaxFee<TAbi extends Abi$1, TFunctionName extends ExtractFunctionNames<TAbi, 'external'>, TArgs extends FunctionArgs<TAbi, TFunctionName>>(contract: Contract, functionName: TFunctionName, functionArgs: TArgs, bufferPercentage: number): Promise<bigint>;
    handleTxReceipt(receipt: GetTxReceiptResponseWithoutHelper, operationName: string): Promise<void>;
}
/**
 * Initializes a new Contract Manager  instance using environment variables.
 *
 * @returns A new Contract Manager instance.
 * @throws Will throw an error if required environment variables are missing.
 */
declare const initializeContractManager: () => ContractManager;

export { ContractManager, initializeContractManager };
