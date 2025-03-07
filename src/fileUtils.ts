import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { logSuccess, logError } from './logger';
import { logInfo } from './logger';
import { StarknetDeployConfig } from './types';

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logInfo(`Created directory: ${dirPath}`);
  } catch (error) {
    logError(`Error creating directory ${dirPath}: ${error}`);
    throw error;
  }
}

// Ensures file exists or creates an empty JSON file if not
export async function ensureFileExists(filePath: string): Promise<void> {
  try {
    const directory = path.dirname(filePath);
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

export async function getNetworkDeploymentPath(
  network: string,
): Promise<string> {
  const config = await loadConfigFile();

  return path.join(
    config.paths.root || process.cwd(),
    'src',
    'scripts',
    'deployments',
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
  try {
    // Create directories and file if they don't exist
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

// Fetches contract address from JSON file
export async function fetchContractAddress(
  contractName: string,
  network: string,
): Promise<string | undefined> {
  try {
    // Create directories and file if they don't exist
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
/**
 * Retrieves the compiled Sierra and CASM code for a given contract.
 *
 * @param contractName - The name of the contract to retrieve compiled code for.
 * @returns am object containing the Sierra and CASM code.
 */
export async function getCompiledCode(contractName: string) {
  const config = await loadConfigFile();
  const packageName = config.paths.package_name || '';
  const projectRoot = config.paths.root || process.cwd();
  const contractClassesDir = config.paths.contractClasses || 'target/dev';

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

    const projectRoot = process.cwd();
    const scriptsDir = 'src/scripts';
    const tasksDir = `${scriptsDir}/tasks`;
    const deploymentsDir = `${scriptsDir}/deployments`;

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

/**
 * Creates a default configuration file at the specified path
 * @param configPath - Path where the config file should be created
 */
export async function createDefaultConfigFile(
  configPath: string,
): Promise<void> {
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

export async function loadConfigFile(): Promise<StarknetDeployConfig> {
  const configPath = path.join(process.cwd(), 'starknet-deploy.config.ts');

  // If config file doesn't exist, create it using the default template
  if (!existsSync(configPath)) {
    await createDefaultConfigFile(configPath);
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loadedConfig = require(configPath);
  // Support both default exports and direct module exports
  return loadedConfig.default || loadedConfig;
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
    root: process.cwd(),
    package_name: 'test_project', // cairo package name
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  }
};

export default config;
`;

export const defaultConfig: StarknetDeployConfig = {
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
    package_name: 'test_project', // cairo package name
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  },
};
