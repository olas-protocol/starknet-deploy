import {
  RpcProvider,
  Account,
  Contract,
  GetTxReceiptResponseWithoutHelper,
  BigNumberish,
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
   * Updates the account used for contract deployment and interaction.
   * @param accountIndex The index of the account in the configuration.
   */
  updateAccount(accountIndex: number): void;
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

declare function ensureDirectoryExists(dirPath: string): Promise<void>;
declare function ensureFileExists(filePath: string): Promise<void>;
/**
 * Saves a contract address to the deployed_contract_addresses.json file.
 *
 * @param contractName - The name of the contract.
 * @param contractAddress - The address of the deployed contract.
 */
declare function saveContractAddress(
  contractName: string,
  contractAddress: string,
): Promise<void>;
declare function fetchContractAddress(
  contractName: string,
): Promise<string | undefined>;
declare function getPackageName(): Promise<string>;
/**
 * Retrieves the compiled Sierra and CASM code for a given contract.
 *
 * @param contractName - The name of the contract to retrieve compiled code for.
 * @returns am object containing the Sierra and CASM code.
 */
declare function getCompiledCode(contractName: string): Promise<{
  sierraCode: any;
  casmCode: any;
}>;
/**
 * Creates the project structure with the following directories:
 * - scriptsDir/deployments
 * - scriptsDir/tasks
 */
declare function createProjectStructure(): Promise<void>;
declare const exampleDeploymentScript =
  '\nimport "dotenv/config";\nimport { initializeContractManager } from "starknet-deploy/dist/index";\n\nasync function main() {\n  const contractManager = initializeContractManager();\n\n  await contractManager.deployContract({\n    contractName: "<contract_name>",\n  });\n}\n\nmain()\n  .then(() => process.exit(0))\n  .catch((error) => {\n    console.error(error);\n    process.exit(1);\n  });\n';
declare const exampleTaskContent =
  "\nimport { initializeContractManager } from \"starknet-deploy/dist/index\";\nimport { Command } from 'commander';\n\nasync function main() {\n\n  const program = new Command();\n  program\n    .requiredOption('-c, --param <param_type>', 'Param definition')\n\n  program.parse(process.argv);\n  const options = program.opts();\n}\n\nmain().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});";
declare const defaultConfigContent =
  "module.exports = {\n  defaultNetwork: 'sepolia',\n  sepolia: {\n    rpcUrl: 'https://starknet-sepolia.public.blastapi.io',\n    accounts: ['<privateKey1>'],\n    addresses: ['<address1>'],\n  },\n  paths: {\n    contractClasses: 'target/dev',\n    deploymentScripts: 'src/scripts/deployments',\n    taskScripts: 'src/scripts/tasks'\n  },\n};\n";

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
declare function logDeploymentDetails(
  contractName: string,
  classHash: BigNumberish,
  contractAddress: string,
): void;

export {
  ContractManager,
  createProjectStructure,
  defaultConfigContent,
  ensureDirectoryExists,
  ensureFileExists,
  exampleDeploymentScript,
  exampleTaskContent,
  fetchContractAddress,
  getCompiledCode,
  getPackageName,
  initializeContractManager,
  logDeploymentDetails,
  logError,
  logInfo,
  logSuccess,
  logWarn,
  saveContractAddress,
};
