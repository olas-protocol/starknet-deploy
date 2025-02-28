import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { logSuccess, logError } from './logger';
import { logInfo } from './logger';
import config from './config';

const projectRoot = config.paths.root || process.cwd();
const packageName = config.paths.package_name || '';
const scriptsDir = config.paths.scripts || 'src/scripts';
const deploymentsDir = `${scriptsDir}/deployments`;
const tasksDir = `${scriptsDir}/tasks`;
const contractClassesDir = config.paths.contractClasses || 'target/dev';

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logSuccess(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}

// Ensures file exists or creates an empty JSON file if not
export async function ensureFileExists(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    console.log('File does not exist, creating a new one.');
    await fs.writeFile(filePath, JSON.stringify({}));
  }
}

export function getNetworkDeploymentPath(network: string): string {
  return path.join(
    projectRoot,
    deploymentsDir,
    network,
    'deployed_contract_addresses.json',
  );
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
  network: string,
) {
  const filePath = getNetworkDeploymentPath(network);
  try {
    await ensureDirectoryExists(path.join(projectRoot, deploymentsDir));
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
  network: string,
): Promise<string | undefined> {
  const filePath = getNetworkDeploymentPath(network);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData[contractName];
  } catch (error) {
    logError(`Error fetching contract address:, ${error}`);
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
  const sierraFilePath = path.join(
    projectRoot,
    contractClassesDir,
    `${packageName}_${contractName}.contract_class.json`,
  );
  const casmFilePath = path.join(
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

/**
 * Creates the project structure with the following directories:
 * - scriptsDir/deployments
 * - scriptsDir/tasks
 */
export async function createProjectStructure() {
  try {
    console.log(LOGO);
    logInfo(`Initializing project structure ...`);

    // Create scripts directory and its subdirectories
    await ensureDirectoryExists(path.join(projectRoot, deploymentsDir));
    await ensureDirectoryExists(path.join(projectRoot, tasksDir));
    logInfo('Creating example task file');

    // Create example task file
    const exampleTaskPath = path.join(projectRoot, tasksDir, 'example_task.ts');
    logInfo(`Example task path: ${exampleTaskPath}`);

    await fs.writeFile(exampleTaskPath, exampleTaskContent);

    // Create example deployment script
    const exampleDeploymentPath = path.join(
      projectRoot,
      deploymentsDir,
      'example_deployment.ts',
    );
    await fs.writeFile(exampleDeploymentPath, exampleDeploymentScript);

    // Create empty addresses file
    const addressesPath = path.join(
      projectRoot,
      deploymentsDir,
      'deployed_contract_addresses.json',
    );

    await fs.writeFile(addressesPath, JSON.stringify({}, null, 2));
    logSuccess('\nStarknet Deploy Project structure created successfully! 🚀');
    logInfo(`\nNext steps:
  1. Add your scripts in ${tasksDir}
  2. Store your deployment artifacts in ${deploymentsDir}`);
  } catch (error) {
    logError(`Failed to create project structure: ${error}`);
    process.exit(1);
  }
}

// Example deployment script content
export const exampleDeploymentScript = `
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

// Example task content
export const exampleTaskContent = `
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

// Default configuration file content that will be created during init
export const defaultConfigContent = `import { StarknetDeployConfig } from 'starknet-deploy';

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
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  }
};

export default config;
`;
