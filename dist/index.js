#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ContractManager: () => ContractManager,
  createDefaultConfigFile: () => createDefaultConfigFile,
  createProjectStructure: () => createProjectStructure,
  defaultConfig: () => defaultConfig,
  defaultConfigContent: () => defaultConfigContent,
  ensureDirectoryExists: () => ensureDirectoryExists,
  ensureFileExists: () => ensureFileExists,
  exampleDeploymentScript: () => exampleDeploymentScript,
  exampleTaskContent: () => exampleTaskContent,
  fetchContractAddress: () => fetchContractAddress,
  getCompiledCode: () => getCompiledCode,
  getNetworkDeploymentPath: () => getNetworkDeploymentPath,
  initializeContractManager: () => initializeContractManager,
  loadConfigFile: () => loadConfigFile,
  logDeploymentDetails: () => logDeploymentDetails,
  logError: () => logError,
  logInfo: () => logInfo,
  logSuccess: () => logSuccess,
  logWarn: () => logWarn,
  saveContractAddress: () => saveContractAddress
});
module.exports = __toCommonJS(src_exports);

// src/ContractManager.ts
var import_starknet = require("starknet");

// src/fileUtils.ts
var import_fs = require("fs");
var import_path = __toESM(require("path"));

// src/logger.ts
var import_colors = __toESM(require("colors"));

// src/common.ts
var explorerURL = `starkscan.co`;
function getExplorerUrl(network, txHash) {
  switch (network) {
    case "sepolia":
      return `https://sepolia.${explorerURL}/tx/${txHash}`;
    case "mainnet":
      return `https://${explorerURL}/tx/${txHash}`;
    default:
      return txHash;
  }
}
function handleError(message) {
  logError(message);
  throw new Error(message);
}
function replacer(_, value) {
  if (typeof value === "bigint") {
    return value.toString();
  } else {
    return value;
  }
}

// src/logger.ts
function formatLog(level, message) {
  return `
[${level}] ${message}`;
}
function logInfo(message) {
  console.log(import_colors.default.blue(formatLog("INFO" /* INFO */, message)));
}
function logWarn(message) {
  console.log(import_colors.default.yellow(formatLog("WARN" /* WARN */, message)));
}
function logError(message) {
  console.error(import_colors.default.red(formatLog("ERROR" /* ERROR */, message)));
}
function logSuccess(message) {
  console.log(import_colors.default.green(formatLog("SUCCESS" /* SUCCESS */, message)));
}
function logDeploymentDetails(network, contractName, classHash, contractAddress) {
  const deploymentURL = `https://${network}.${explorerURL}/contract/${contractAddress}`;
  const deploymentMessage = `
    ${import_colors.default.green(`${contractName} Contract deployed successfully`)}
    ${import_colors.default.green(`Class Hash: ${classHash}`)}
    ${import_colors.default.green(`Contract Address: ${contractAddress}`)}
    ${import_colors.default.green(`Explorer URL: ${deploymentURL}`)}
    `;
  logSuccess(deploymentMessage);
}

// src/fileUtils.ts
async function ensureDirectoryExists(dirPath) {
  try {
    await import_fs.promises.mkdir(dirPath, { recursive: true });
    logInfo(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}
async function ensureFileExists(filePath) {
  try {
    const directory = import_path.default.dirname(filePath);
    if (!(0, import_fs.existsSync)(directory)) {
      await import_fs.promises.mkdir(directory, { recursive: true });
      logInfo(`Created directory: ${directory}`);
    }
    if (!(0, import_fs.existsSync)(filePath)) {
      await import_fs.promises.writeFile(filePath, JSON.stringify({}));
      logInfo(`Created file: ${filePath}`);
    }
  } catch (error) {
    logError(`Error ensuring file exists: ${error}`);
    throw error;
  }
}
async function getNetworkDeploymentPath(network) {
  const config = await loadConfigFile();
  return import_path.default.join(
    config.paths.root || process.cwd(),
    "src",
    "scripts",
    "deployments",
    network,
    "deployed_contract_addresses.json"
  );
}
async function saveContractAddress(contractName, contractAddress, network) {
  try {
    const filePath = await getNetworkDeploymentPath(network);
    await ensureFileExists(filePath);
    const data = await import_fs.promises.readFile(filePath, "utf8");
    const jsonData = data.trim() ? JSON.parse(data) : {};
    jsonData[contractName] = contractAddress;
    await import_fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    logSuccess(`Contract address saved to ${filePath}`);
  } catch (error) {
    logError(`Error saving contract address: ${error}`);
    throw error;
  }
}
async function fetchContractAddress(contractName, network) {
  try {
    const filePath = await getNetworkDeploymentPath(network);
    await ensureFileExists(filePath);
    const data = await import_fs.promises.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);
    return jsonData[contractName];
  } catch (error) {
    logError(`Error fetching contract address: ${error}`);
    throw error;
  }
}
async function getCompiledCode(contractName, config) {
  const packageName = config.paths.package_name || "";
  const projectRoot = config.paths.root || process.cwd();
  const contractClassesDir = config.paths.contractClasses || "target/dev";
  const sierraFilePath = import_path.default.join(
    projectRoot,
    contractClassesDir,
    `${packageName}_${contractName}.contract_class.json`
  );
  const casmFilePath = import_path.default.join(
    projectRoot,
    contractClassesDir,
    `${packageName}_${contractName}.compiled_contract_class.json`
  );
  const code = [sierraFilePath, casmFilePath].map(async (filePath) => {
    const file = await import_fs.promises.readFile(filePath);
    return JSON.parse(file.toString("ascii"));
  });
  const [sierraCode, casmCode] = await Promise.all(code);
  return {
    sierraCode,
    casmCode
  };
}
async function createProjectStructure() {
  try {
    console.log(LOGO);
    logInfo(`Initializing project structure ...`);
    const projectRoot = process.cwd();
    const scriptsDir = "src/scripts";
    const tasksDir = `${scriptsDir}/tasks`;
    const deploymentsDir = `${scriptsDir}/deployments`;
    await createDefaultConfigFile(
      import_path.default.join(projectRoot, "starknet-deploy.config.ts")
    );
    await ensureDirectoryExists(import_path.default.join(projectRoot, deploymentsDir));
    await ensureDirectoryExists(import_path.default.join(projectRoot, tasksDir));
    logInfo("Creating example task file");
    const exampleTaskPath = import_path.default.join(projectRoot, tasksDir, "example_task.ts");
    logInfo(`Example task path: ${exampleTaskPath}`);
    await import_fs.promises.writeFile(exampleTaskPath, exampleTaskContent);
    const exampleDeploymentPath = import_path.default.join(
      projectRoot,
      deploymentsDir,
      "example_deployment.ts"
    );
    await import_fs.promises.writeFile(exampleDeploymentPath, exampleDeploymentScript);
    logSuccess("\nStarknet Deploy Project structure created successfully! \u{1F680}");
    logInfo(`
Next steps:
  1. Add your scripts in ${tasksDir}
  2. Store your deployment artifacts in ${deploymentsDir}`);
  } catch (error) {
    logError(`Failed to create project structure: ${error}`);
    process.exit(1);
  }
}
async function createDefaultConfigFile(configPath) {
  try {
    await import_fs.promises.writeFile(configPath, defaultConfigContent);
    logInfo(`Created default configuration file at ${configPath}`);
    logInfo("\nPlease update the configuration file with your:");
    logInfo("1. Network private keys in the accounts array");
    logInfo("2. Account addresses in the addresses array");
  } catch (error) {
    logError(`Failed to create default config file: ${error}`);
    throw error;
  }
}
async function loadConfigFile() {
  const configPath = import_path.default.join(process.cwd(), "starknet-deploy.config.ts");
  if (!(0, import_fs.existsSync)(configPath)) {
    await createDefaultConfigFile(configPath);
    process.exit(1);
  }
  const loadedConfig = require(configPath);
  return loadedConfig.default || loadedConfig;
}
var exampleDeploymentScript = `
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Deploy a contract named 'MyContract' with constructor arguments
  const contractAddress = await contractManager.deployContract({
    contractName: 'MyContract',
    constructorArgs: [123, '0x456'],
  });

})();
`;
var exampleTaskContent = `
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Invoke a function (e.g., 'transfer') to update the contract state
  const txHash = await contractManager.invokeContract(
    'MyToken', // Contract reference (name, address, or instance)
    'transfer', // Function name
    ['0x04a1496...', 1000], // Function arguments
    20, // Optional fee buffer percentage (default is 20%)
  );

})();
`;
var LOGO = `
\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551 \u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D
\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2554\u255D \u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557     \u2588\u2588\u2551   
\u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D     \u2588\u2588\u2551   
\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2557\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551   
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D   \u255A\u2550\u255D   \u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D   \u255A\u2550\u255D   
                                                                    
\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557      \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557                  
\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u255A\u2588\u2588\u2557 \u2588\u2588\u2554\u255D                  
\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u2588\u2588\u2551   \u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2554\u255D                   
\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2551     \u2588\u2588\u2551   \u2588\u2588\u2551  \u255A\u2588\u2588\u2554\u255D                    
\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D   \u2588\u2588\u2551                     
\u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D    \u255A\u2550\u255D                                       
`;
var defaultConfigContent = `import { StarknetDeployConfig } from 'starknet-deploy';
import dotenv from 'dotenv';
dotenv.config();

const config: StarknetDeployConfig = {
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
      accounts: [process.env.PRIVATE_KEY_1],
      addresses: [process.env.ADDRESS_1],
    },
    local: {
      rpcUrl: 'http://localhost:5050',
      accounts: [],
      addresses: []
    }
  },
  paths: {
    root: process.cwd(),
    package_name: 'test_project', // scarb package name, prefix for contract classes
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  }
};

export default config;
`;
var defaultConfig = {
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      rpcUrl: "https://starknet-sepolia.public.blastapi.io",
      accounts: ["<privateKey1>"],
      addresses: ["<address1>"]
    },
    local: {
      rpcUrl: "http://localhost:5050",
      accounts: [],
      addresses: []
    }
  },
  paths: {
    root: process.cwd(),
    package_name: "test_project",
    // cairo package name
    contractClasses: "target/dev",
    scripts: "src/scripts"
  }
};

// src/ContractManager.ts
var ContractManager = class {
  provider;
  account;
  constructor(rpcEndpoint, privateKey, accountAddress) {
    this.provider = new import_starknet.RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new import_starknet.Account(
      this.provider,
      accountAddress,
      privateKey,
      void 0,
      "0x3"
    );
  }
  /**
   * Updates the account used for contract deployment and interaction.
   * @param accountOrIndex The account object or index of the account in the configuration.
   */
  async updateAccount(accountOrIndex) {
    if (accountOrIndex instanceof import_starknet.Account) {
      this.account = accountOrIndex;
      logInfo(`Switched to account with address: ${accountOrIndex.address}`);
      return;
    }
    const accountIndex = accountOrIndex;
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    const networkConfig = config.networks[currentNetwork];
    if (!networkConfig) {
      throw new Error(
        `Network configuration not found for network: ${currentNetwork}`
      );
    }
    if (accountIndex < 0 || accountIndex >= networkConfig.accounts.length) {
      throw new Error(`Invalid account index provided: ${accountIndex}`);
    }
    const privateKey = networkConfig.accounts[accountIndex];
    const accountAddress = networkConfig.addresses[accountIndex];
    if (!privateKey) {
      throw new Error(
        `Private key not found for account index: ${accountIndex}`
      );
    }
    if (!accountAddress) {
      throw new Error(
        `Account address not found for account index: ${accountIndex}`
      );
    }
    this.account = new import_starknet.Account(
      this.provider,
      accountAddress,
      privateKey,
      void 0,
      "0x3"
    );
    logInfo(
      `Switched to account index ${accountIndex}. New account address: ${accountAddress}`
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
  async deployContract(deploymentConfig) {
    const { contractName, constructorArgs } = deploymentConfig;
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    logInfo(
      `Deploying contract: ${contractName}, with initial args: ${JSON.stringify(constructorArgs, replacer, 2)}`
    );
    try {
      const { sierraCode, casmCode } = await getCompiledCode(
        contractName,
        config
      );
      let constructorCalldata;
      if (constructorArgs) {
        const callData = new import_starknet.CallData(sierraCode.abi);
        constructorCalldata = callData.compile("constructor", constructorArgs);
      }
      const deployResponse = await this.account.declareAndDeploy({
        contract: sierraCode,
        casm: casmCode,
        constructorCalldata,
        salt: import_starknet.stark.randomAddress()
      });
      logDeploymentDetails(
        config.defaultNetwork,
        contractName,
        deployResponse.declare.class_hash,
        deployResponse.deploy.address
      );
      await saveContractAddress(
        contractName,
        deployResponse.deploy.address,
        currentNetwork
      );
      return deployResponse.deploy.address;
    } catch (error) {
      logError(
        `Failed to deploy ${contractName} contract  with error: ${error}`
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
  async getContractInstance(contractName) {
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    const contractAddress = await fetchContractAddress(
      contractName,
      currentNetwork
    );
    if (!contractAddress) {
      throw new Error(`Contract address for ${contractName} not found`);
    }
    const { sierraCode } = await getCompiledCode(contractName, config);
    const contract_abi = sierraCode.abi;
    const contract = new import_starknet.Contract(
      contract_abi,
      contractAddress,
      this.provider
    );
    logSuccess(
      `Connected to ${contractName} contract with address ${this.account.address}`
    );
    return contract;
  }
  /**
   * Connects to a deployed contract by fetching its ABI from the network.
   * @param contractAddress The address of the deployed contract.
   * @returns A connected Contract instance.
   */
  async getContractByAddress(contractAddress) {
    const checksumAddress = (0, import_starknet.getChecksumAddress)(contractAddress);
    try {
      const { abi: contractAbi } = await this.provider.getClassAt(checksumAddress);
      if (!contractAbi) {
        throw new Error(
          `No ABI found for contract at address ${checksumAddress}`
        );
      }
      const contract = new import_starknet.Contract(
        contractAbi,
        checksumAddress,
        this.provider
      );
      return contract;
    } catch (error) {
      logError(`Failed to connect to contract at address ${checksumAddress}:`);
      throw error;
    }
  }
  /**
   * Checks if a string is a valid Starknet address
   * @param value String to check
   * @returns boolean indicating if the string is a Starknet address
   */
  isStarknetAddress(value) {
    return /^0x[0-9a-fA-F]{62,64}$/.test(value);
  }
  /**
   * Resolves a contract reference to a Contract instance.
   * @param contractRef Contract instance, contract address string, or contract name
   * @returns Promise resolving to a Contract instance
   * @private
   */
  async resolveContract(contractRef) {
    if (typeof contractRef !== "string") {
      return contractRef;
    }
    if (this.isStarknetAddress(contractRef)) {
      return await this.getContractByAddress(contractRef);
    } else {
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
  validateFunctionExists(contract, functionName) {
    if (!Object.prototype.hasOwnProperty.call(contract.functions, functionName)) {
      throw new Error(
        `Function '${functionName}' does not exist on the contract at address ${contract.address}`
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
  async queryContract(contract, functionName, args = []) {
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
  async invokeContract(contract, functionName, args = [], bufferPercentage = 20) {
    const contractInstance = await this.resolveContract(contract);
    contractInstance.connect(this.account);
    this.validateFunctionExists(contractInstance, functionName);
    const maxFee = await this.estimateMaxFee(
      contractInstance,
      functionName,
      args,
      bufferPercentage
    );
    try {
      const txResponse = await contractInstance.invoke(functionName, args, {
        maxFee
      });
      const txReceipt = await this.provider.waitForTransaction(
        txResponse.transaction_hash
      );
      this.handleTxReceipt(txReceipt, functionName);
      return txResponse.transaction_hash;
    } catch (error) {
      logError(
        `An error occurred during execution of ${functionName} function`
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
  async estimateMaxFee(contract, functionName, args = [], bufferPercentage) {
    const feeEstimate = await contract.estimate(functionName, args);
    const suggestedMaxFee = BigInt(feeEstimate.suggestedMaxFee);
    const maxFee = suggestedMaxFee * BigInt(100 + bufferPercentage) / BigInt(100);
    logInfo(
      `Suggested max fee for ${functionName}: ${suggestedMaxFee}, Max fee with buffer: ${maxFee}`
    );
    return maxFee;
  }
  // Helper function to handle transaction receipt
  async handleTxReceipt(receipt, operationName) {
    const receiptTx = new import_starknet.ReceiptTx(receipt);
    const config = await loadConfigFile();
    const currentNetwork = config.defaultNetwork;
    receiptTx.match({
      success: (successReceipt) => {
        logSuccess(
          `${operationName} transaction succeeded
Explorer URL: ${getExplorerUrl(currentNetwork, successReceipt.transaction_hash)}`
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
      }
    });
  }
};
var initializeContractManager = async () => {
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
    if (!rpcEndpoint) missingValues.push("rpcUrl");
    if (!privateKey) missingValues.push("accounts[0]");
    if (!accountAddress) missingValues.push("addresses[0]");
    throw new Error(
      `Missing required network configuration values for "${currentNetwork}": ${missingValues.join(", ")}. Please check your starknet-deploy config file and ensure all required fields are provided.`
    );
  }
  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContractManager,
  createDefaultConfigFile,
  createProjectStructure,
  defaultConfig,
  defaultConfigContent,
  ensureDirectoryExists,
  ensureFileExists,
  exampleDeploymentScript,
  exampleTaskContent,
  fetchContractAddress,
  getCompiledCode,
  getNetworkDeploymentPath,
  initializeContractManager,
  loadConfigFile,
  logDeploymentDetails,
  logError,
  logInfo,
  logSuccess,
  logWarn,
  saveContractAddress
});
