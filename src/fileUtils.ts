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
export async function getCompiledCode(
  contractName: string,
  config: StarknetDeployConfig,
) {
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

    // Create configuration file
    await createDefaultConfigFile(
      path.join(projectRoot, 'starknet-deploy.config.ts'),
    );

    // Create scripts directory and its subdirectories
    await ensureDirectoryExists(path.join(projectRoot, deploymentsDir));
    await ensureDirectoryExists(path.join(projectRoot, tasksDir));
    logInfo('Creating example task file');

    // Create example task file
    const exampleTaskPath = path.join(projectRoot, tasksDir, 'example_task.ts');
    logInfo(`Created example task at: ${exampleTaskPath}`);

    await fs.writeFile(exampleTaskPath, exampleTaskContent);

    // Create example deployment script
    const exampleDeploymentPath = path.join(
      projectRoot,
      deploymentsDir,
      'example_deployment.ts',
    );
    await fs.writeFile(exampleDeploymentPath, exampleDeploymentScript);
    logInfo(`Created example deployment at: ${exampleDeploymentPath}`);

    logSuccess('\nStarknet Deploy Project structure created successfully! 🚀');
    logInfo(`\nNext steps:
  1. Update your configuration in starknet-deploy.config.ts
  2. Add your scripts in ${tasksDir}
  3. Store your deployment scripts in ${deploymentsDir}`);
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
    logInfo('Please update the configuration file with your:');
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
export const exampleDeploymentScript = `/**
 * Example Deployment Script
 * 
 * To run this script:
 * npx tsx src/scripts/deployments/example_deployment.ts
 */
import { initializeContractManager } from '@olas-protocol/starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Deploy a contract named 'MyContract' with constructor arguments
  const contractAddress = await contractManager.deployContract({
    contractName: 'MyContract',
    constructorArgs: [123, '0x456'],
  });

})();
`;

// Example task content
export const exampleTaskContent = `/**
 * Example Task Script
 * 
 * To run this script:
 * npx tsx src/scripts/tasks/example_task.ts
 */
import { initializeContractManager } from '@olas-protocol/starknet-deploy';

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
export const defaultConfigContent = `import { StarknetDeployConfig } from '@olas-protocol/starknet-deploy';
import dotenv from 'dotenv';
dotenv.config();

const config: StarknetDeployConfig = {
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
      accounts: [process.env.PRIVATE_KEY_1!],
      addresses: [process.env.ADDRESS_1!],
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

export const defaultConfig: StarknetDeployConfig = {
  defaultNetwork: 'sepolia',
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
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
