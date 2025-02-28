import path from 'path';
import { existsSync } from 'fs';
import { StarknetDeployConfig } from './types';

const configPath = path.join(process.cwd(), 'starknet-deploy.config.ts');

if (!existsSync(configPath)) {
  throw new Error(
    'Configuration file(starknet-deploy.config.ts) not found. Please run `starknet-deploy init` to create one.',
  );
}

const config = require(configPath) as StarknetDeployConfig;

export default config;
