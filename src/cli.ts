import { Command } from 'commander';
import { createProjectStructure } from './index';

const program = new Command();

program
  .name('starknet-deploy')
  .description(
    'A tool designed to streamline the deployment, interaction, and management of StarkNet contracts',
  )
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
