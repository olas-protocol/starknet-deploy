import {
  ensureDirectoryExists,
  getPackageName,
  logError,
  logInfo,
  logSuccess,
} from './chunk-FQSG3CSA.mjs';

// src/cli.ts
import path from 'path';
import { promises as fs } from 'fs';
import { Command } from 'commander';
async function createProjectStructure() {
  try {
    const packageName = await getPackageName();
    const scriptsDir = path.join(process.cwd(), 'src/scripts');
    logInfo(`Initializing project structure for ${packageName}...`);
    await ensureDirectoryExists(path.join(scriptsDir, 'deployments'));
    await ensureDirectoryExists(path.join(scriptsDir, 'tasks'));
    const exampleTaskPath = path.join(scriptsDir, 'tasks', 'example.ts');
    await fs.writeFile(exampleTaskPath, exampleTaskContent);
    logSuccess(`Created example task at ${exampleTaskPath}`);
    const exampleDeploymentPath = path.join(
      scriptsDir,
      'deployments',
      'example-deployment.ts',
    );
    await fs.writeFile(exampleDeploymentPath, exampleDeploymentScript);
    logSuccess(`Created example deployment script at ${exampleDeploymentPath}`);
    const addressesPath = path.join(
      scriptsDir,
      'deployments',
      'deployed_contract_addresses.json',
    );
    await fs.writeFile(addressesPath, JSON.stringify({}, null, 2));
    logSuccess(`Created addresses file at ${addressesPath}`);
    logSuccess('\nProject structure created successfully! \u{1F680}');
    logInfo(`
Next steps:
  1. Add your deployment scripts in src/scripts/tasks
  2. Store your deployment artifacts in src/scripts/deployments`);
  } catch (error) {
    logError(`Failed to create project structure: ${error}`);
    process.exit(1);
  }
}
createProjectStructure();
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
var program = new Command();
program
  .name('starknet-deploy')
  .description('CLI tool for StarkNet contract deployment')
  .version('0.0.1');
program
  .command('init')
  .description('Initialize a new StarkNet Deploy project')
  .action(createProjectStructure);
program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
