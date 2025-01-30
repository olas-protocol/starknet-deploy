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

// src/logger.ts
init_esm_shims();
import colors from 'colors';
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
    ${colors.green(`Explorer URL: ${process.env.BLOCK_EXPLORER_URL}/contract/${contractAddress}`)}
    `;
  logSuccess(deploymentMessage);
}

// src/fileUtils.ts
init_esm_shims();
import { promises as fs, existsSync } from 'fs';
import path2 from 'path';
import toml from 'toml';
var projectRoot = process.cwd();
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}
async function ensureFileExists(filePath) {
  if (!existsSync(filePath)) {
    console.log('File does not exist, creating a new one.');
    await fs.writeFile(filePath, JSON.stringify({}));
  }
}
async function saveContractAddress(contractName, contractAddress) {
  const filePath = path2.join(
    projectRoot,
    'src/scripts/deployments',
    'deployed_contract_addresses.json',
  );
  try {
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
async function fetchContractAddress(contractName) {
  const filePath = path2.join(
    projectRoot,
    'src/scripts/deployments',
    'deployed_contract_addresses.json',
  );
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData[contractName];
  } catch (error) {
    logError(`Error fetching contract address:, ${error}`);
    throw error;
  }
}
async function getPackageName() {
  const tomlPath = path2.join(projectRoot, 'Scarb.toml');
  try {
    const tomlData = await fs.readFile(tomlPath, 'utf8');
    const parsedToml = toml.parse(tomlData);
    return parsedToml.package.name;
  } catch (error) {
    logError(`Error reading Scarb.toml:, ${error}`);
    throw error;
  }
}
async function getCompiledCode(contractName) {
  const packageName = await getPackageName();
  const sierraFilePath = path2.join(
    projectRoot,
    'target/dev',
    `${packageName}_${contractName}.contract_class.json`,
  );
  const casmFilePath = path2.join(
    projectRoot,
    'target/dev',
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
  saveContractAddress,
  fetchContractAddress,
  getPackageName,
  getCompiledCode,
};
