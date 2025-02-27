import path from 'path';
import { existsSync } from 'fs';

const configPath = path.join(process.cwd(), 'starknet-deploy.config.js');

if (!existsSync(configPath)) {
  throw new Error(
    'Configuration file(starknet-deploy.config.js) not found. Please run `starknet-deploy init` to create one.',
  );
}

const config = require(configPath);

export default config;
