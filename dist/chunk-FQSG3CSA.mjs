// src/logger.ts
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
import { promises as fs, existsSync } from 'fs';
import path from 'path';
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
  const filePath = path.join(
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
  const filePath = path.join(
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
  const tomlPath = path.join(projectRoot, 'Scarb.toml');
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
  const sierraFilePath = path.join(
    projectRoot,
    'target/dev',
    `${packageName}_${contractName}.contract_class.json`,
  );
  const casmFilePath = path.join(
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
