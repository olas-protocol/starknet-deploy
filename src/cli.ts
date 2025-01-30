import path from 'path';
import {
  logInfo,
  logSuccess,
  logError,
  ensureDirectoryExists,
  getPackageName,
} from './index';
import { promises as fs } from 'fs';
import { Command } from 'commander';

async function createProjectStructure() {
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

const program = new Command();

program
  .name('starknet-deploy')
  .description('CLI tool for StarkNet contract deployment')
  .version('0.0.1');

program
  .command('init')
  .description('Initialize a new StarkNet Deploy project')
  .action(createProjectStructure);

program.parse(process.argv);

// Handle case when no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

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
