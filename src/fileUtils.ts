import { promises as fs, existsSync } from 'fs';
import path from 'path';
import toml from 'toml';
import { logSuccess, logError } from './logger';
import { logInfo } from './logger';
const projectRoot = process.cwd();

export async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}

// Ensures file exists or creates an empty JSON file if not
export async function ensureFileExists(filePath: string) {
  if (!existsSync(filePath)) {
    console.log('File does not exist, creating a new one.');
    await fs.writeFile(filePath, JSON.stringify({}));
  }
}

/**
 * Saves a contract address to the deployed_contract_addresses.json file.
 *
 * @param contractName - The name of the contract.
 * @param contractAddress - The address of the deployed contract.
 */
export async function saveContractAddress(
  contractName: string,
  contractAddress: string,
) {
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

// Fetches contract address from JSON file
export async function fetchContractAddress(
  contractName: string,
): Promise<string | undefined> {
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

// Retrieves package name from Scarb.toml
export async function getPackageName(): Promise<string> {
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

/**
 * Retrieves the compiled Sierra and CASM code for a given contract.
 *
 * @param contractName - The name of the contract to retrieve compiled code for.
 * @returns am object containing the Sierra and CASM code.
 */
export async function getCompiledCode(contractName: string) {
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

/**
 * Creates the project structure with the following directories:
 * - src/scripts/deployments
 * - src/scripts/tasks
 */
export async function createProjectStructure() {
  try {
    const packageName = await getPackageName();
    const scriptsDir = path.join(process.cwd(), 'src/scripts');
    console.log(LOGO);
    logInfo(`Initializing project structure for ${packageName}...`);

    // Create scripts directory and its subdirectories
    await ensureDirectoryExists(path.join(scriptsDir, 'deployments'));
    await ensureDirectoryExists(path.join(scriptsDir, 'tasks'));

    // Create example task file
    const exampleTaskPath = path.join(scriptsDir, 'tasks', 'example_task.ts');
    await fs.writeFile(exampleTaskPath, exampleTaskContent);

    // Create example deployment script
    const exampleDeploymentPath = path.join(
      scriptsDir,
      'deployments',
      'example_deployment.ts',
    );
    await fs.writeFile(exampleDeploymentPath, exampleDeploymentScript);

    // Create empty addresses file
    const addressesPath = path.join(
      scriptsDir,
      'deployments',
      'deployed_contract_addresses.json',
    );
    await fs.writeFile(addressesPath, JSON.stringify({}, null, 2));
    logSuccess('\nStarknet Deploy Project structure created successfully! 🚀');
    logInfo(`\nNext steps:
  1. Add your scripts in src/scripts/tasks
  2. Store your deployment artifacts in src/scripts/deployments`);
  } catch (error) {
    logError(`Failed to create project structure: ${error}`);
    process.exit(1);
  }
}

// Example deployment script content
const exampleDeploymentScript = `
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

// Example task content
const exampleTaskContent = `
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

const LOGO = `
███████╗████████╗ █████╗ ██████╗ ██╗  ██╗███╗   ██╗███████╗████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║ ██╔╝████╗  ██║██╔════╝╚══██╔══╝
███████╗   ██║   ███████║██████╔╝█████╔╝ ██╔██╗ ██║█████╗     ██║   
╚════██║   ██║   ██╔══██║██╔══██╗██╔═██╗ ██║╚██╗██║██╔══╝     ██║   
███████║   ██║   ██║  ██║██║  ██║██║  ██╗██║ ╚████║███████╗   ██║   
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   
                                                                    
██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗                  
██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝                  
██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝                   
██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝                    
██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║                     
╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝                                       
`;
