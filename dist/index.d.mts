import { RpcProvider, Account, Contract, ArgsOrCalldata, Result, GetTxReceiptResponseWithoutHelper, RawArgsArray, BigNumberish } from 'starknet';
export { Account, Contract, Result } from 'starknet';

interface DeploymentConfig {
    contractName: string;
    constructorArgs?: RawArgsArray;
}
/**
 * Provides methods for deploying and interacting with contracts.
 */
declare class ContractManager {
    provider: RpcProvider;
    account: Account;
    constructor(rpcEndpoint: string, privateKey: string, accountAddress: string);
    /**
     * Updates the account used for contract deployment and interaction.
     * @param accountOrIndex The account object or index of the account in the configuration.
     */
    updateAccount(accountOrIndex: Account | number): Promise<void>;
    /**
     * Deploys a contract with the given configuration.
     *
     * @param contractName The name of the contract to be deployed
     * @param constructorArgs Optional constructor arguments for the contract
     * @returns deployed contract address
     * @throws Will throw an error if the deployment fails.
     */
    deployContract(deploymentConfig: DeploymentConfig): Promise<string>;
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
    getContractByAddress(contractAddress: string): Promise<Contract>;
    /**
     * Checks if a string is a valid Starknet address
     * @param value String to check
     * @returns boolean indicating if the string is a Starknet address
     */
    isStarknetAddress(value: string): boolean;
    /**
     * Resolves a contract reference to a Contract instance.
     * @param contractRef Contract instance, contract address string, or contract name
     * @returns Promise resolving to a Contract instance
     * @private
     */
    private resolveContract;
    /**
     * Checks if a function exists on a contract.
     * @param contract - The contract instance to check.
     * @param functionName - The name of the function to check for.
     * @throws An error if the function doesn't exist.
     * @private
     */
    private validateFunctionExists;
    /**
     *  Queries a function on a deployed contract.
     * @param contract Contract name, contract instance, or contract address.
     * @param functionName The name of the function to call on the contract.
     * @param args The arguments for the function.
     * @returns A promise that resolves with the result of the contract function call.
     * @throws Will throw an error if the transaction fails.
     */
    queryContract(contract: Contract | string, functionName: string, args?: ArgsOrCalldata): Promise<Result>;
    /**
     * Invokes a function on a deployed contract.
     * @param contract Contract name, contract instance, or contract address.
     * @param functionName The name of the function to call on the contract.
     * @param args The arguments for the function.
     * @param bufferPercentage - Optional. The percentage buffer to add to the max fee (default is 20%).
     * @returns A promise that resolves with the transaction receipt.
     * @throws Will throw an error if the transaction fails.
     */
    invokeContract(contract: Contract | string, functionName: string, args?: ArgsOrCalldata, bufferPercentage?: number): Promise<string>;
    /**
     * Estimates the maximum fee required for a Starknet transaction.
     * @param contract - The Starknet contract instance.
     * @param functionName - The name of the function to estimate the fee for.
     * @param functionArgs - The arguments to pass to the function.
     * @param bufferPercentage - The percentage buffer to add to the suggested max fee.
     * @returns The multiplied suggested max fee.
     */
    estimateMaxFee(contract: Contract, functionName: string, args: ArgsOrCalldata | undefined, bufferPercentage: number): Promise<bigint>;
    handleTxReceipt(receipt: GetTxReceiptResponseWithoutHelper, operationName: string): Promise<void>;
}
/**
 * Initializes a new Contract Manager  instance using environment variables.
 *
 * @returns A new Contract Manager instance.
 * @throws Will throw an error if required environment variables are missing.
 */
declare const initializeContractManager: () => Promise<ContractManager>;

interface StarknetDeployConfig {
    defaultNetwork: string;
    networks: NetworksConfig;
    paths: ProjectPathsConfig;
}
/**
 * @property package_name - Optional package name for the cairo project
 * @property root - Optional root directory of the project (defaults to current directory)
 * @property contractClasses - Directory where compiled contract classes are stored
 * @property scripts - Directory containing deployment and task scripts
 */
interface ProjectPathsConfig {
    package_name?: string;
    root?: string;
    contractClasses: string;
    scripts: string;
}
interface NetworksConfig {
    [networkName: string]: NetworkConfig;
}
interface NetworkConfig {
    rpcUrl: string;
    accounts: string[];
    addresses: string[];
}

declare function ensureDirectoryExists(dirPath: string): Promise<void>;
declare function ensureFileExists(filePath: string): Promise<void>;
declare function getNetworkDeploymentPath(network: string): Promise<string>;
/**
 * Saves a contract address to the deployed_contract_addresses.json file.
 *
 * @param contractName - The name of the contract.
 * @param contractAddress - The address of the deployed contract.
 */
declare function saveContractAddress(contractName: string, contractAddress: string, network: string): Promise<void>;
declare function fetchContractAddress(contractName: string, network: string): Promise<string | undefined>;
/**
 * Retrieves the compiled Sierra and CASM code for a given contract.
 *
 * @param contractName - The name of the contract to retrieve compiled code for.
 * @returns am object containing the Sierra and CASM code.
 */
declare function getCompiledCode(contractName: string, config: StarknetDeployConfig): Promise<{
    sierraCode: any;
    casmCode: any;
}>;
/**
 * Creates the project structure with the following directories:
 * - scriptsDir/deployments
 * - scriptsDir/tasks
 */
declare function createProjectStructure(): Promise<void>;
/**
 * Creates a default configuration file at the specified path
 * @param configPath - Path where the config file should be created
 */
declare function createDefaultConfigFile(configPath: string): Promise<void>;
declare function loadConfigFile(): Promise<StarknetDeployConfig>;
declare const exampleDeploymentScript = "\nimport { initializeContractManager } from 'starknet-deploy';\n\n(async () => {\n  const contractManager = await initializeContractManager();\n\n  // Deploy a contract named 'MyContract' with constructor arguments\n  const contractAddress = await contractManager.deployContract({\n    contractName: 'MyContract',\n    constructorArgs: [123, '0x456'],\n  });\n\n})();\n";
declare const exampleTaskContent = "\nimport { initializeContractManager } from 'starknet-deploy';\n\n(async () => {\n  const contractManager = await initializeContractManager();\n\n  // Invoke a function (e.g., 'transfer') to update the contract state\n  const txHash = await contractManager.invokeContract(\n    'MyToken', // Contract reference (name, address, or instance)\n    'transfer', // Function name\n    ['0x04a1496...', 1000], // Function arguments\n    20, // Optional fee buffer percentage (default is 20%)\n  );\n\n})();\n";
declare const defaultConfigContent = "import { StarknetDeployConfig } from 'starknet-deploy';\nimport dotenv from 'dotenv';\ndotenv.config();\n\nconst config: StarknetDeployConfig = {\n  defaultNetwork: \"sepolia\",\n  networks: {\n    sepolia: {\n      rpcUrl: 'https://starknet-sepolia.public.blastapi.io',\n      accounts: [process.env.PRIVATE_KEY_1],\n      addresses: [process.env.ADDRESS_1],\n    },\n    local: {\n      rpcUrl: 'http://localhost:5050',\n      accounts: [],\n      addresses: []\n    }\n  },\n  paths: {\n    root: process.cwd(),\n    package_name: 'test_project', // scarb package name, prefix for contract classes\n    contractClasses: 'target/dev',\n    scripts: 'src/scripts',\n  }\n};\n\nexport default config;\n";
declare const defaultConfig: StarknetDeployConfig;

declare function logInfo(message: string): void;
declare function logWarn(message: string): void;
declare function logError(message: string): void;
declare function logSuccess(message: string): void;
/**
 * Logs deployment details to the console.
 *
 * @param contractName - The name of the deployed contract.
 * @param classHash - The class hash of the deployed contract.
 * @param contractAddress - The address of the deployed contract.
 */
declare function logDeploymentDetails(network: string, contractName: string, classHash: BigNumberish, contractAddress: string): void;

export { ContractManager, type NetworkConfig, type NetworksConfig, type ProjectPathsConfig, type StarknetDeployConfig, createDefaultConfigFile, createProjectStructure, defaultConfig, defaultConfigContent, ensureDirectoryExists, ensureFileExists, exampleDeploymentScript, exampleTaskContent, fetchContractAddress, getCompiledCode, getNetworkDeploymentPath, initializeContractManager, loadConfigFile, logDeploymentDetails, logError, logInfo, logSuccess, logWarn, saveContractAddress };
