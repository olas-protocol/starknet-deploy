#!/usr/bin/env node
'use strict';
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
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ContractManager: () => ContractManager,
  createProjectStructure: () => createProjectStructure,
  ensureDirectoryExists: () => ensureDirectoryExists,
  ensureFileExists: () => ensureFileExists,
  exampleDeploymentScript: () => exampleDeploymentScript,
  exampleTaskContent: () => exampleTaskContent,
  fetchContractAddress: () => fetchContractAddress,
  getCompiledCode: () => getCompiledCode,
  getPackageName: () => getPackageName,
  initializeContractManager: () => initializeContractManager,
  logDeploymentDetails: () => logDeploymentDetails,
  logError: () => logError,
  logInfo: () => logInfo,
  logSuccess: () => logSuccess,
  logWarn: () => logWarn,
  saveContractAddress: () => saveContractAddress,
});
module.exports = __toCommonJS(src_exports);

// src/ContractManager.ts
var import_starknet = require('starknet');

// src/fileUtils.ts
var import_fs = require('fs');
var import_path = __toESM(require('path'));
var import_toml = __toESM(require('toml'));

// src/logger.ts
var import_colors = __toESM(require('colors'));
function formatLog(level, message) {
  return `
[${level}] ${message}`;
}
function logInfo(message) {
  console.log(
    import_colors.default.blue(formatLog('INFO' /* INFO */, message)),
  );
}
function logWarn(message) {
  console.log(
    import_colors.default.yellow(formatLog('WARN' /* WARN */, message)),
  );
}
function logError(message) {
  console.error(
    import_colors.default.red(formatLog('ERROR' /* ERROR */, message)),
  );
}
function logSuccess(message) {
  console.log(
    import_colors.default.green(formatLog('SUCCESS' /* SUCCESS */, message)),
  );
}
function logDeploymentDetails(contractName, classHash, contractAddress) {
  const deploymentMessage = `
    ${import_colors.default.green(`${contractName} Contract deployed successfully`)}
    ${import_colors.default.green(`Class Hash: ${classHash}`)}
    ${import_colors.default.green(`Contract Address: ${contractAddress}`)}
    ${import_colors.default.green(`Explorer URL: ${process.env.BLOCK_EXPLORER_URL}/contract/${contractAddress}`)}
    `;
  logSuccess(deploymentMessage);
}

// src/fileUtils.ts
var projectRoot = process.cwd();
async function ensureDirectoryExists(dirPath) {
  try {
    await import_fs.promises.mkdir(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}
async function ensureFileExists(filePath) {
  if (!(0, import_fs.existsSync)(filePath)) {
    console.log('File does not exist, creating a new one.');
    await import_fs.promises.writeFile(filePath, JSON.stringify({}));
  }
}
async function saveContractAddress(contractName, contractAddress) {
  const filePath = import_path.default.join(
    projectRoot,
    'src/scripts/deployments',
    'deployed_contract_addresses.json',
  );
  try {
    await ensureFileExists(filePath);
    const data = await import_fs.promises.readFile(filePath, 'utf8');
    const jsonData = data.trim() ? JSON.parse(data) : {};
    jsonData[contractName] = contractAddress;
    await import_fs.promises.writeFile(
      filePath,
      JSON.stringify(jsonData, null, 2),
    );
    logSuccess(`Contract address saved to ${filePath}`);
  } catch (error) {
    logError(`Error saving contract address: ${error}`);
    throw error;
  }
}
async function fetchContractAddress(contractName) {
  const filePath = import_path.default.join(
    projectRoot,
    'src/scripts/deployments',
    'deployed_contract_addresses.json',
  );
  try {
    const data = await import_fs.promises.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData[contractName];
  } catch (error) {
    logError(`Error fetching contract address:, ${error}`);
    throw error;
  }
}
async function getPackageName() {
  const tomlPath = import_path.default.join(projectRoot, 'Scarb.toml');
  try {
    const tomlData = await import_fs.promises.readFile(tomlPath, 'utf8');
    const parsedToml = import_toml.default.parse(tomlData);
    return parsedToml.package.name;
  } catch (error) {
    logError(`Error reading Scarb.toml:, ${error}`);
    throw error;
  }
}
async function getCompiledCode(contractName) {
  const packageName = await getPackageName();
  const sierraFilePath = import_path.default.join(
    projectRoot,
    'target/dev',
    `${packageName}_${contractName}.contract_class.json`,
  );
  const casmFilePath = import_path.default.join(
    projectRoot,
    'target/dev',
    `${packageName}_${contractName}.compiled_contract_class.json`,
  );
  const code = [sierraFilePath, casmFilePath].map(async (filePath) => {
    const file = await import_fs.promises.readFile(filePath);
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
    console.log('fetching package name');
    const packageName = await getPackageName();
    console.log('Package name:', packageName);
    const scriptsDir = import_path.default.join(process.cwd(), 'src/scripts');
    console.log(LOGO);
    logInfo(`Initializing project structure for ${packageName}...`);
    await ensureDirectoryExists(
      import_path.default.join(scriptsDir, 'deployments'),
    );
    await ensureDirectoryExists(import_path.default.join(scriptsDir, 'tasks'));
    console.log('Creating example task file');
    const exampleTaskPath = import_path.default.join(
      scriptsDir,
      'tasks',
      'example_task.ts',
    );
    console.log('Example task path:', exampleTaskPath);
    await import_fs.promises.writeFile(exampleTaskPath, exampleTaskContent);
    const exampleDeploymentPath = import_path.default.join(
      scriptsDir,
      'deployments',
      'example_deployment.ts',
    );
    await import_fs.promises.writeFile(
      exampleDeploymentPath,
      exampleDeploymentScript,
    );
    const addressesPath = import_path.default.join(
      scriptsDir,
      'deployments',
      'deployed_contract_addresses.json',
    );
    await import_fs.promises.writeFile(
      addressesPath,
      JSON.stringify({}, null, 2),
    );
    logSuccess(
      '\nStarknet Deploy Project structure created successfully! \u{1F680}',
    );
    logInfo(`
Next steps:
  1. Add your scripts in src/scripts/tasks
  2. Store your deployment artifacts in src/scripts/deployments`);
  } catch (error) {
    logError(`Failed to create project structure: ${error}`);
    process.exit(1);
  }
}
var exampleDeploymentScript = `
import "dotenv/config";
import { initializeContractManager } from "starknet-deploy/dist/index";

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
import { initializeContractManager } from "starknet-deploy/dist/index";
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

// src/common.ts
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
    this.provider = new import_starknet.RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new import_starknet.Account(
      this.provider,
      accountAddress,
      privateKey,
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
  async deployContract(config) {
    const { contractName, constructorArgs } = config;
    logInfo(
      `Deploying contract: ${contractName}, with initial args: ${JSON.stringify(constructorArgs, replacer, 2)}`,
    );
    try {
      const { sierraCode, casmCode } = await getCompiledCode(contractName);
      let constructorCalldata;
      if (constructorArgs) {
        const callData = new import_starknet.CallData(sierraCode.abi);
        constructorCalldata = callData.compile('constructor', constructorArgs);
      }
      const deployResponse = await this.account.declareAndDeploy({
        contract: sierraCode,
        casm: casmCode,
        constructorCalldata,
        salt: import_starknet.stark.randomAddress(),
      });
      logDeploymentDetails(
        contractName,
        deployResponse.declare.class_hash,
        deployResponse.deploy.address,
      );
      await saveContractAddress(contractName, deployResponse.deploy.address);
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
    const contractAddress = await fetchContractAddress(contractName);
    if (!contractAddress) {
      throw new Error(`Contract address for ${contractName} not found`);
    }
    const { sierraCode } = await getCompiledCode(contractName);
    const contract_abi = sierraCode.abi;
    const contract = new import_starknet.Contract(
      contract_abi,
      contractAddress,
      this.provider,
    );
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
      const contract = new import_starknet.Contract(
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
    const receiptTx = new import_starknet.ReceiptTx(receipt);
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
var initializeContractManager = () => {
  const rpcEndpoint = process.env.RPC_ENDPOINT;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const accountAddress = process.env.DEPLOYER_ADDRESS;
  if (!rpcEndpoint || !privateKey || !accountAddress) {
    throw new Error('Missing required environment variables');
  }
  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    ContractManager,
    createProjectStructure,
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
  });
