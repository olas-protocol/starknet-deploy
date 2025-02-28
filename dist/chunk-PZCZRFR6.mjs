#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) =>
  typeof require !== 'undefined'
    ? require
    : typeof Proxy !== 'undefined'
      ? new Proxy(x, {
          get: (a, b) => (typeof require !== 'undefined' ? require : a)[b],
        })
      : x)(function (x) {
  if (typeof require !== 'undefined') return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) =>
  function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res;
  };
var __commonJS = (cb, mod) =>
  function __require2() {
    return (
      mod ||
        (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod),
      mod.exports
    );
  };
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target,
    mod,
  )
);

// node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from 'url';
import path from 'path';
var init_esm_shims = __esm({
  'node_modules/tsup/assets/esm_shims.js'() {
    'use strict';
  },
});

// src/index.ts
init_esm_shims();

// src/ContractManager.ts
init_esm_shims();
import {
  Account,
  RpcProvider,
  CallData,
  stark,
  Contract,
  ReceiptTx,
} from 'starknet';

// src/fileUtils.ts
init_esm_shims();
import { promises as fs, existsSync } from 'fs';
import path2 from 'path';

// src/logger.ts
init_esm_shims();
import colors from 'colors';
var explorerURL = `https://starkscan.co/`;
function formatLog(level, message) {
  return `
[${level}] ${message}`;
}
function logInfo(message) {
  console.log(colors.blue(formatLog('INFO' /* INFO */, message)));
}
function logWarn(message) {
  console.log(colors.yellow(formatLog('WARN' /* WARN */, message)));
}
function logError(message) {
  console.error(colors.red(formatLog('ERROR' /* ERROR */, message)));
}
function logSuccess(message) {
  console.log(colors.green(formatLog('SUCCESS' /* SUCCESS */, message)));
}
function logDeploymentDetails(contractName, classHash, contractAddress) {
  const deploymentMessage = `
    ${colors.green(`${contractName} Contract deployed successfully`)}
    ${colors.green(`Class Hash: ${classHash}`)}
    ${colors.green(`Contract Address: ${contractAddress}`)}
    ${colors.green(`Explorer URL: ${explorerURL}/contract/${contractAddress}`)}
    `;
  logSuccess(deploymentMessage);
}

// src/fileUtils.ts
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logInfo(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}
async function ensureFileExists(filePath) {
  try {
    const directory = path2.dirname(filePath);
    if (!existsSync(directory)) {
      await fs.mkdir(directory, { recursive: true });
      logInfo(`Created directory: ${directory}`);
    }
    if (!existsSync(filePath)) {
      await fs.writeFile(filePath, JSON.stringify({}));
      logInfo(`Created file: ${filePath}`);
    }
  } catch (error) {
    logError(`Error ensuring file exists: ${error}`);
    throw error;
  }
}
async function getNetworkDeploymentPath(network) {
  const config = await loadConfigFile();
  return path2.join(
    config.paths.root || process.cwd(),
    'deployments',
    network,
    'deployed_contract_addresses.json',
  );
}
async function saveContractAddress(contractName, contractAddress, network) {
  try {
    const filePath = await getNetworkDeploymentPath(network);
    await ensureFileExists(filePath);
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = data.trim() ? JSON.parse(data) : {};
    jsonData[contractName] = contractAddress;
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
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
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData[contractName];
  } catch (error) {
    logError(`Error fetching contract address: ${error}`);
    throw error;
  }
}
async function getCompiledCode(contractName) {
  const config = await loadConfigFile();
  const packageName = config.paths.package_name || '';
  const projectRoot = config.paths.root || process.cwd();
  const contractClassesDir = config.paths.contractClasses || 'target/dev';
  const sierraFilePath = path2.join(
    projectRoot,
    contractClassesDir,
    `${packageName}_${contractName}.contract_class.json`,
  );
  const casmFilePath = path2.join(
    projectRoot,
    contractClassesDir,
    `${packageName}_${contractName}.compiled_contract_class.json`,
  );
  const code = [sierraFilePath, casmFilePath].map(async (filePath) => {
    const file = await fs.readFile(filePath);
    return JSON.parse(file.toString('ascii'));
  });
  const [sierraCode, casmCode] = await Promise.all(code);
  return {
    sierraCode,
    casmCode,
  };
}
async function createProjectStructure() {
  try {
    console.log(LOGO);
    logInfo(`Initializing project structure ...`);
    const config = await loadConfigFile();
    const projectRoot = config.paths.root || process.cwd();
    const scriptsDir = config.paths.scripts || 'src/scripts';
    const tasksDir = `${scriptsDir}/tasks`;
    const deploymentsDir = `${scriptsDir}/deployments`;
    await ensureDirectoryExists(path2.join(projectRoot, deploymentsDir));
    await ensureDirectoryExists(path2.join(projectRoot, tasksDir));
    logInfo('Creating example task file');
    const exampleTaskPath = path2.join(
      projectRoot,
      tasksDir,
      'example_task.ts',
    );
    logInfo(`Example task path: ${exampleTaskPath}`);
    await fs.writeFile(exampleTaskPath, exampleTaskContent);
    const exampleDeploymentPath = path2.join(
      projectRoot,
      deploymentsDir,
      'example_deployment.ts',
    );
    await fs.writeFile(exampleDeploymentPath, exampleDeploymentScript);
    const addressesPath = path2.join(
      projectRoot,
      deploymentsDir,
      'deployed_contract_addresses.json',
    );
    await fs.writeFile(addressesPath, JSON.stringify({}, null, 2));
    logSuccess(
      '\nStarknet Deploy Project structure created successfully! \u{1F680}',
    );
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
    await fs.writeFile(configPath, defaultConfigContent);
    logInfo(`Created default configuration file at ${configPath}`);
    logInfo('\nPlease update the configuration file with your:');
    logInfo('1. Network private keys in the accounts array');
    logInfo('2. Account addresses in the addresses array');
  } catch (error) {
    logError(`Failed to create default config file: ${error}`);
    throw error;
  }
}
async function loadConfigFile() {
  const configPath = path2.join(process.cwd(), 'starknet-deploy.config.ts');
  if (!existsSync(configPath)) {
    await createDefaultConfigFile(configPath);
    process.exit(1);
  }
  const loadedConfig = __require(configPath);
  return loadedConfig.default || loadedConfig;
}
var exampleDeploymentScript = `
import "dotenv/config";
import { initializeContractManager } from "starknet-deploy";

async function main() {
  const contractManager = initializeContractManager();

  await contractManager.deployContract({
    contractName: "<contract_name>",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
var exampleTaskContent = `
import { initializeContractManager } from "starknet-deploy";
import { Command } from 'commander';

async function main() {

  const program = new Command();
  program
    .requiredOption('-c, --param <param_type>', 'Param definition')

  program.parse(process.argv);
  const options = program.opts();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});`;
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

const config: StarknetDeployConfig = {
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
      accounts: ['<privateKey1>'],
      addresses: ['<address1>'],
    },
    local: {
      rpcUrl: 'http://localhost:5050',
      accounts: [],
      addresses: []
    }
  },
  paths: {
    root: process.cwd(),
    package_name: 'test_project', // cairo package name
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  }
};

export default config;
`;
var defaultConfig = {
  defaultNetwork: 'sepolia',
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
      accounts: ['<privateKey1>'],
      addresses: ['<address1>'],
    },
    local: {
      rpcUrl: 'http://localhost:5050',
      accounts: [],
      addresses: [],
    },
  },
  paths: {
    root: process.cwd(),
    package_name: 'test_project',
    // cairo package name
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  },
};

// src/common.ts
init_esm_shims();
function getExplorerUrl(txHash) {
  return process.env.BLOCK_EXPLORER_URL
    ? `${process.env.BLOCK_EXPLORER_URL}/tx/${txHash}`
    : txHash;
}
function handleError(message) {
  logError(message);
  throw new Error(message);
}
function replacer(_, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  } else {
    return value;
  }
}

// src/ContractManager.ts
var ContractManager = class {
  provider;
  account;
  constructor(rpcEndpoint, privateKey, accountAddress) {
    this.provider = new RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new Account(this.provider, accountAddress, privateKey);
  }
  /**
   * Updates the account used for contract deployment and interaction.
   * @param accountIndex The index of the account in the configuration.
   */
  async updateAccount(accountIndex) {
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
  async deployContract(deploymentConfig) {
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
  async getContractInstance(contractName) {
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
    const contract = new Contract(contract_abi, contractAddress, this.provider);
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
  async connectToDeployedContract(contractAddress) {
    try {
      const { abi: contractAbi } =
        await this.provider.getClassAt(contractAddress);
      if (!contractAbi) {
        throw new Error(
          `No ABI found for contract at address ${contractAddress}`,
        );
      }
      const contract = new Contract(
        contractAbi,
        contractAddress,
        this.provider,
      );
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
    contract,
    functionName,
    args = [],
    bufferPercentage = 20,
  ) {
    let contractInstance;
    if (typeof contract === 'string') {
      contractInstance = await this.connectToDeployedContract(contract);
    } else {
      contractInstance = contract;
    }
    const maxFee = await this.estimateMaxFee(
      contractInstance,
      functionName,
      args,
      bufferPercentage,
    );
    try {
      const txResponse = await contractInstance.functions[functionName](
        ...args,
        { maxFee },
      );
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
  async estimateMaxFee(contract, functionName, functionArgs, bufferPercentage) {
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
  async handleTxReceipt(receipt, operationName) {
    const receiptTx = new ReceiptTx(receipt);
    receiptTx.match({
      success: (successReceipt) => {
        logSuccess(
          `${operationName} transaction succeeded
Explorer URL: ${getExplorerUrl(successReceipt.transaction_hash)}`,
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
    throw new Error('Missing required network configuration values');
  }
  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};

// src/types.ts
init_esm_shims();

export {
  __require,
  __commonJS,
  __toESM,
  init_esm_shims,
  logInfo,
  logWarn,
  logError,
  logSuccess,
  logDeploymentDetails,
  ensureDirectoryExists,
  ensureFileExists,
  getNetworkDeploymentPath,
  saveContractAddress,
  fetchContractAddress,
  getCompiledCode,
  createProjectStructure,
  createDefaultConfigFile,
  loadConfigFile,
  exampleDeploymentScript,
  exampleTaskContent,
  defaultConfigContent,
  defaultConfig,
  ContractManager,
  initializeContractManager,
};
