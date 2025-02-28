# StarkNet Deploy

A simple StarkNet contract deployment-intereaction tool.

## Overview

This tool helps you deploy and interact with contracts with ease.

## Install

To install the tool, run:

```sh
npm install starknet-deploy
```

## Getting Started

### Initializing Your Project

Run the initialization command to set up your project structure:

```sh
npx starknet-deploy-init
```

This will:

- Create a basic project structure with deployment and task directories
- Generate a configuration file (starknet-deploy.config.ts)
- Add example deployment scripts and tasks

### Project Structure

After initialization, your project will have this structure:

```
your-project/
├── src/
│   └── scripts/
│       ├── deployments/
│       │   ├── example_deployment.ts
│       │   └── deployed_contract_addresses.json
│       └── tasks/
│           └── example_task.ts
└── starknet-deploy.config.ts
```

## Configuration

### Configuration File

The configuration is stored in starknet-deploy.config.ts:

```typescript
import { StarknetDeployConfig } from 'starknet-deploy';

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
    package_name?: string;   // Your Scarb package name (used for compiled contract file names)
    root?: string;           // Project root directory (defaults to current working directory)
    contractClasses: string; // Directory containing compiled contract classes
    scripts: string;         // Directory for deployment scripts and tasks
  }
};
```
