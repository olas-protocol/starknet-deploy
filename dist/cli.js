'use strict';
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/cli.ts
var import_path2 = __toESM(require('path'));

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

// src/fileUtils.ts
var import_fs = require('fs');
var import_path = __toESM(require('path'));
var import_toml = __toESM(require('toml'));
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

// src/cli.ts
var import_fs2 = require('fs');
var import_commander = require('commander');
async function createProjectStructure() {
  try {
    const packageName = await getPackageName();
    const scriptsDir = import_path2.default.join(process.cwd(), 'src/scripts');
    logInfo(`Initializing project structure for ${packageName}...`);
    await ensureDirectoryExists(
      import_path2.default.join(scriptsDir, 'deployments'),
    );
    await ensureDirectoryExists(import_path2.default.join(scriptsDir, 'tasks'));
    const exampleTaskPath = import_path2.default.join(
      scriptsDir,
      'tasks',
      'example.ts',
    );
    await import_fs2.promises.writeFile(exampleTaskPath, exampleTaskContent);
    logSuccess(`Created example task at ${exampleTaskPath}`);
    const exampleDeploymentPath = import_path2.default.join(
      scriptsDir,
      'deployments',
      'example-deployment.ts',
    );
    await import_fs2.promises.writeFile(
      exampleDeploymentPath,
      exampleDeploymentScript,
    );
    logSuccess(`Created example deployment script at ${exampleDeploymentPath}`);
    const addressesPath = import_path2.default.join(
      scriptsDir,
      'deployments',
      'deployed_contract_addresses.json',
    );
    await import_fs2.promises.writeFile(
      addressesPath,
      JSON.stringify({}, null, 2),
    );
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
var program = new import_commander.Command();
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
