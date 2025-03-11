# StarkNet Deploy

**StarkNet Deploy** is a tool designed to streamline the deployment, interaction, and management of StarkNet contracts. This guide walks you through setting up your project, configuring your environment, and leveraging our public functions to work with contracts easily.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Project Initialization](#project-initialization)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Using the Contract Manager](#using-the-contract-manager)
  - [Initialization](#initialization)
  - [Deploying Contracts](#deploying-contracts)
  - [Interacting with Contracts](#interacting-with-contracts)
    - [Getting a Contract Instance](#getting-a-contract-instance)
    - [Reading Contract State (Call)](#reading-contract-state-call)
    - [Writing to Contract State (Invoke)](#writing-to-contract-state-invoke)
  - [Switching Accounts](#switching-accounts)
- [Available Public Functions](#available-public-functions)

## Overview

**StarkNet Contract Manager** simplifies the process of:

- **Deploying contracts:** Automatically manage deployments and store contract addresses.
- **Interacting with contracts:** Easily call view functions or send transactions.
- **Managing accounts:** Seamlessly switch between different accounts for transactions.

## Installation

Install the package via npm:

```sh
npm install starknet-deploy
```

## Project Initialization

Set up your project with a single command that creates the necessary directories, configuration file, and example scripts:

```sh
npx starknet-deploy init
```

This command will:

- Create a project structure including directories for deployments and tasks.
- Generate a configuration file (starknet-deploy.config.ts).
- Add example deployment scripts and tasks to help you get started.

## Project Structure

After initialization, your project will have a structure similar to:

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

The main configuration is defined in the starknet-deploy.config.ts file. Here you can set your network details, account keys, and project paths.

Configuration File Example

```typescript
import { StarknetDeployConfig } from 'starknet-deploy';

const config: StarknetDeployConfig = {
  // Default network used for deployments and interactions
  defaultNetwork: 'sepolia',

  // Network settings
  networks: {
    sepolia: {
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io', // RPC URL for Sepolia
      accounts: ['<privateKey1>'], // Array of private keys for transactions
      addresses: ['<address1>'], // Array of addresses for the  given private keys
    },
    local: {
      rpcUrl: 'http://localhost:5050',
      accounts: [],
      addresses: [],
    },
  },

  // File paths for contract classes and scripts
  paths: {
    package_name: 'your_scarb_package_name', // (Optional) Your Scarb package name for compiled contract file names.
    root: '', // (Optional) Project root directory (defaults to current working directory)
    contractClasses: 'target/dev', // Directory containing compiled contract classes
    scripts: 'src/scripts', // Directory for deployment scripts and tasks
  },
};

export default config;
```

## Using the Contract Manager

The Contract Manager exposes several public functions to help you deploy contracts, interact with them, and manage your accounts.

### Initialization

Before performing any operations, initialize the Contract Manager:

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  // Initialize the contract manager
  const contractManager = await initializeContractManager();
  // Now you can deploy or interact with contracts
})();
```

### Deploying Contracts

Deploy contracts using the deployContract function. Deployed addresses are stored automatically for future reference.

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Deploy a contract named 'MyContract' with constructor arguments
  const contractAddress = await contractManager.deployContract({
    contractName: 'MyContract',
    constructorArgs: [123, '0x456'],
  });

  console.log(`Contract deployed at: ${contractAddress}`);
})();
```

### Interacting with Contracts

#### Getting a Contract Instance

Retrieve a contract instance by its name (from saved deployments) or by using its address directly.

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Get contract instance by name
  const contractInstance =
    await contractManager.getContractInstance('MyContract');

  // Or get contract instance by address
  const contractByAddress =
    await contractManager.getContractByAddress('0x04a149636a5...');
})();
```

#### Reading Contract State (Call)

To read state (i.e., call a view function), use the queryContract function with the appropriate parameters.

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Call a view function (e.g., 'balanceOf') to read contract state
  const balance = await contractManager.queryContract(
    'MyToken', // Contract reference (name, address, or instance)
    'balanceOf', // Function name
    ['0x04a1496...'], // Function arguments
  );

  console.log(`Balance: ${balance}`);
})();
```

#### Writing to Contract State (Invoke)

For state-changing operations, invoke a function using the invokeContract method. You can also specify an optional fee buffer percentage.

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Invoke a function (e.g., 'transfer') to update the contract state
  const txHash = await contractManager.invokeContract(
    'MyToken', // Contract reference (name, address, or instance)
    'transfer', // Function name
    ['0x04a1496...', 1000], // Function arguments
    20, // Optional fee buffer percentage (default is 20%)
  );

  console.log(`Transaction sent. Hash: ${txHash}`);
})();
```

### Switching Accounts

You can change the account used for sending transactions with the updateAccount function. This allows you to manage multiple accounts seamlessly.

```typescript
import { initializeContractManager } from 'starknet-deploy';

(async () => {
  const contractManager = await initializeContractManager();

  // Switch to a different account by index (e.g., second account in the config)
  await contractManager.updateAccount(1);

  // Alternatively, pass a custom account object:
  // await contractManager.updateAccount(myCustomAccount);

  // Subsequent transactions will use the updated account
  const txHash = await contractManager.invokeContract(
    'MyContract',
    'setOwner',
    ['0x04a1496...'],
  );

  console.log(`Transaction sent. Hash: ${txHash}`);
})();
```

## Available Public Functions

The following functions are publicly available via the Contract Manager:

- **initializeContractManager()**
  Initializes and returns an instance of the Contract Manager.

- **deployContract({ contractName, constructorArgs })**
  Deploys a contract with the given name and constructor arguments.

- **getContractInstance(contractName: string)**
  Retrieves a deployed contract instance by its name from saved deployments.

- **getContractByAddress(address: string)**
  Retrieves a contract instance using its address.

- **queryContract(contractReference, functionName, args)**
  Queries a contract's view function.

- **invokeContract(contractReference, functionName, args, feeBuffer?)**
  Sends a state-changing transaction to a contract.

  - The contractReference can be a contract name, an address, or a contract instance.
  - The feeBuffer is an optional parameter for fee estimation (default is 20%).

- **updateAccount(account: number | object)**
  Switches the active account for transactions by index (number) or using a custom account object.
