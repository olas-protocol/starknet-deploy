import {
  Account,
  RpcProvider,
  CallData,
  stark,
  Contract,
  GetTxReceiptResponseWithoutHelper,
  ReceiptTx,
  Abi,
  RawArgsArray,
} from 'starknet';
import {
  getCompiledCode,
  saveContractAddress,
  fetchContractAddress,
} from './fileUtils';
import { logError, logInfo, logSuccess, logDeploymentDetails } from './logger';
import { getExplorerUrl, handleError, replacer } from './common';
import { ExtractFunctionNames, FunctionResponse } from './contract';
import { Calldata, FunctionArgs } from 'abi-wan-kanabi/kanabi';
interface DeploymentConfig {
  contractName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructorArgs?: Record<string, any>;
}

/**
 * Provides methods for deploying and interacting with contracts.
 */
export class ContractManager {
  public provider: RpcProvider;
  public account: Account;

  constructor(rpcEndpoint: string, privateKey: string, accountAddress: string) {
    this.provider = new RpcProvider({ nodeUrl: rpcEndpoint });
    this.account = new Account(this.provider, accountAddress, privateKey);
  }

  async getAbi(contractName: string): Promise<Abi> {
    const { sierraCode } = await getCompiledCode(contractName);
    return sierraCode.abi;
  }

  async executeTransaciton<
    TAbi extends Abi,
    TFunctionName extends ExtractFunctionNames<TAbi, 'external'>,
    TArgs extends FunctionArgs<TAbi, TFunctionName>,
    TFunctionResponse extends FunctionResponse<TAbi, TFunctionName>,
  >(params: {
    abi: TAbi;
    contract: string;
    functionName: TFunctionName;
    args: TArgs;
    options?: { bufferPercentage?: number };
  }): Promise<TFunctionResponse | any> {
    const { functionName, args, contract } = params;
    const { bufferPercentage = 20 } = params.options || {};
    let contractInstance: Contract;
    // Determine if contract is an instance or an address
    if (typeof contract === 'string') {
      // It's a contract address, connect to the deployed contract
      contractInstance = await this.getContractInstance(contract);
    } else {
      contractInstance = contract;
    }
    try {
      // Execute the contract function
      const txResponse = await contractInstance.functions[functionName]!(
        args as CallData,
        //{ maxFee },
      );
      // Wait for the transaction to be mined
      const txReceipt = await this.provider.waitForTransaction(
        txResponse.transaction_hash,
      );
      this.handleTxReceipt(txReceipt, functionName);

      return txResponse.transaction_hash;
    } catch (error) {
      logError(
        `An error occurred during ${functionName} execution of ${functionName} function:`,
      );
      console.error(error);
      throw error;
    }
  }
  /**
   * Deploys a contract with the given configuration.
   *
   * @param contractName The name of the contract to be deployed
   * @param constructorArgs Optional constructor arguments for the contract
   * @returns A promise that resolves when the deployment is complete.
   * @throws Will throw an error if the deployment fails.
   */

  async deployContract(config: DeploymentConfig): Promise<void> {
    const { contractName, constructorArgs } = config;

    logInfo(
      `Deploying contract: ${contractName}, with initial args: ${JSON.stringify(constructorArgs, replacer, 2)}`,
    );

    try {
      const { sierraCode, casmCode } = await getCompiledCode(contractName);

      let constructorCalldata;
      if (constructorArgs) {
        const callData = new CallData(sierraCode.abi);
        constructorCalldata = callData.compile('constructor', constructorArgs);
      }

      const deployResponse = await this.account.declareAndDeploy({
        contract: sierraCode,
        casm: casmCode,
        constructorCalldata,
        salt: stark.randomAddress(),
      });

      logDeploymentDetails(
        contractName,
        deployResponse.declare.class_hash,
        deployResponse.deploy.address,
      );
      await saveContractAddress(contractName, deployResponse.deploy.address);
    } catch (error) {
      logError(`Failed to deploy ${contractName} contract`);
      console.error(error);
      process.exit(1);
    }
  }
  /**
   * Retrieves an instance of a deployed local contract.
   * @param contractName The name of the contract to be deployed.
   * @returns The deployed contract instance.
   *
   */
  async getContractInstance(contractName: string): Promise<Contract> {
    const contractAddress = await fetchContractAddress(contractName);
    if (!contractAddress) {
      throw new Error(`Contract address for ${contractName} not found`);
    }

    const { sierraCode } = await getCompiledCode(contractName);
    const contract_abi = sierraCode.abi;

    const contract: Contract = new Contract(
      contract_abi,
      contractAddress,
      this.provider,
    );
    // Connect the contract to the account for signing transactions
    contract.connect(this.account);
    logSuccess(
      `Connected to ${contractName} contract with address ${this.account.address}`,
    );
    return contract;
  }
  /**
   * Connects to a deployed contract by fetching its ABI from the network.
   * @param contractAddress The address of the deployed contract.
   * @returns A connected Contract instance.
   */
  async connectToDeployedContract(contractAddress: string): Promise<Contract> {
    try {
      // Fetch the contract class at the given address
      const { abi: contractAbi } =
        await this.provider.getClassAt(contractAddress);

      if (!contractAbi) {
        throw new Error(
          `No ABI found for contract at address ${contractAddress}`,
        );
      }

      // Create a new Contract instance with the ABI and address
      const contract = new Contract(
        contractAbi,
        contractAddress,
        this.provider,
      );

      // Connect the contract to the account for signing transactions
      contract.connect(this.account);

      return contract;
    } catch (error) {
      logError(`Failed to connect to contract at address ${contractAddress}:`);
      throw error;
    }
  }

  /**
   * Estimates the maximum fee required for a Starknet transaction.
   * @param contract - The Starknet contract instance.
   * @param functionName - The name of the function to estimate the fee for.
   * @param functionArgs - The arguments to pass to the function.
   * @param bufferPercentage - The percentage buffer to add to the suggested max fee.
   * @returns The multiplied suggested max fee.
   */
  async estimateMaxFee<
    TAbi extends Abi,
    TFunctionName extends ExtractFunctionNames<TAbi, 'external'>,
    TArgs extends FunctionArgs<TAbi, TFunctionName>,
  >(
    contract: Contract,
    functionName: TFunctionName,
    functionArgs: TArgs,
    bufferPercentage: number,
  ): Promise<bigint> {
    const feeEstimate = await contract.estimateFee[functionName]!(
      functionArgs as Calldata,
    );
    const suggestedMaxFee = BigInt(feeEstimate.suggestedMaxFee);
    const maxFee =
      (suggestedMaxFee * BigInt(100 + bufferPercentage)) / BigInt(100);
    logInfo(
      `Suggested max fee for ${functionName}: ${suggestedMaxFee}, Max fee with buffer: ${maxFee}`,
    );
    return maxFee;
  }

  // Helper function to handle transaction receipt
  async handleTxReceipt(
    receipt: GetTxReceiptResponseWithoutHelper,
    operationName: string,
  ): Promise<void> {
    const receiptTx = new ReceiptTx(receipt);

    receiptTx.match({
      success: (successReceipt) => {
        logSuccess(
          `${operationName} transaction succeeded\nExplorer URL: ${getExplorerUrl(successReceipt.transaction_hash)}`,
        );
      },
      reverted: (revertedReceipt) => {
        const message = `${operationName} transaction reverted: ${revertedReceipt.revert_reason}`;
        handleError(message);
      },
      rejected: (rejectedReceipt) => {
        const message = `${operationName} transaction rejected with status: ${rejectedReceipt.status}`;
        handleError(message);
      },
      _: () => {
        const message = `${operationName} transaction failed with unknown error`;
        handleError(message);
      },
    });
  }
}
/**
 * Initializes a new Contract Manager  instance using environment variables.
 *
 * @returns A new Contract Manager instance.
 * @throws Will throw an error if required environment variables are missing.
 */
export const initializeContractManager = (): ContractManager => {
  const rpcEndpoint = process.env.RPC_ENDPOINT;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const accountAddress = process.env.DEPLOYER_ADDRESS;

  if (!rpcEndpoint || !privateKey || !accountAddress) {
    throw new Error('Missing required environment variables');
  }

  return new ContractManager(rpcEndpoint, privateKey, accountAddress);
};

const abi = [
  {
    type: 'impl',
    name: 'IOpinionMarketImpl',
    interface_name:
      'opinion_prediction_market::interfaces::IOpinion_Market::IOpinion_Market',
  },
  {
    type: 'enum',
    name: 'opinion_prediction_market::utils::common::enums::MarketState',
    variants: [
      {
        name: 'Uninitialized',
        type: '()',
      },
      {
        name: 'Initialized',
        type: '()',
      },
      {
        name: 'Settled',
        type: '()',
      },
      {
        name: 'Claimed',
        type: '()',
      },
    ],
  },
  {
    type: 'enum',
    name: 'opinion_prediction_market::utils::common::enums::MarketOutcome',
    variants: [
      {
        name: 'NOT_EXISTS',
        type: '()',
      },
      {
        name: 'INVALID',
        type: '()',
      },
      {
        name: 'PA_EXISTS',
        type: '()',
      },
      {
        name: 'SPA_EXISTS',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::Payouts',
    members: [
      {
        name: 'writer_payout_from_tips',
        type: 'core::integer::u128',
      },
      {
        name: 'writer_payout_from_stake',
        type: 'core::integer::u128',
      },
      {
        name: 'olas_pool_payout',
        type: 'core::integer::u128',
      },
      {
        name: 'writer_payout_total',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::bool',
    variants: [
      {
        name: 'False',
        type: '()',
      },
      {
        name: 'True',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'cubit::f128::types::fixed::Fixed',
    members: [
      {
        name: 'mag',
        type: 'core::integer::u128',
      },
      {
        name: 'sign',
        type: 'core::bool',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::Market',
    members: [
      {
        name: 'state',
        type: 'opinion_prediction_market::utils::common::enums::MarketState',
      },
      {
        name: 'outcome',
        type: 'opinion_prediction_market::utils::common::enums::MarketOutcome',
      },
      {
        name: 'payouts',
        type: 'opinion_prediction_market::utils::common::structs::Payouts',
      },
      {
        name: 'spread_ratio',
        type: 'cubit::f128::types::fixed::Fixed',
      },
      {
        name: 'writer_share',
        type: 'cubit::f128::types::fixed::Fixed',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::Writer',
    members: [
      {
        name: 'address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'stake',
        type: 'core::integer::u128',
      },
      {
        name: 'stance',
        type: 'core::bool',
      },
      {
        name: 'is_claimed',
        type: 'core::bool',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::VoteCounts',
    members: [
      {
        name: 'yes_p',
        type: 'core::integer::u128',
      },
      {
        name: 'yes_q',
        type: 'core::integer::u128',
      },
      {
        name: 'no_p',
        type: 'core::integer::u128',
      },
      {
        name: 'no_q',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::TipAmounts',
    members: [
      {
        name: 'yes_q',
        type: 'core::integer::u128',
      },
      {
        name: 'no_q',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::SpaParameters',
    members: [
      {
        name: 'threshold',
        type: 'cubit::f128::types::fixed::Fixed',
      },
      {
        name: 'strength',
        type: 'cubit::f128::types::fixed::Fixed',
      },
      {
        name: 'influence',
        type: 'cubit::f128::types::fixed::Fixed',
      },
      {
        name: 'curvature',
        type: 'cubit::f128::types::fixed::Fixed',
      },
    ],
  },
  {
    type: 'struct',
    name: 'openzeppelin_token::erc20::interface::ERC20ABIDispatcher',
    members: [
      {
        name: 'contract_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::interfaces::IRegistry::IRegistryDispatcher',
    members: [
      {
        name: 'contract_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::byte_array::ByteArray',
    members: [
      {
        name: 'data',
        type: 'core::array::Array::<core::bytes_31::bytes31>',
      },
      {
        name: 'pending_word',
        type: 'core::felt252',
      },
      {
        name: 'pending_word_len',
        type: 'core::integer::u32',
      },
    ],
  },
  {
    type: 'interface',
    name: 'opinion_prediction_market::interfaces::IOpinion_Market::IOpinion_Market',
    items: [
      {
        type: 'function',
        name: 'expiry',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u64',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'market',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::utils::common::structs::Market',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'writer',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::utils::common::structs::Writer',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'vote_counts',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::utils::common::structs::VoteCounts',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'tip_amounts',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::utils::common::structs::TipAmounts',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'spa_parameters',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::utils::common::structs::SpaParameters',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'voting_token',
        inputs: [],
        outputs: [
          {
            type: 'openzeppelin_token::erc20::interface::ERC20ABIDispatcher',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'registry',
        inputs: [],
        outputs: [
          {
            type: 'opinion_prediction_market::interfaces::IRegistry::IRegistryDispatcher',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'content_identifier',
        inputs: [],
        outputs: [
          {
            type: 'core::byte_array::ByteArray',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'multiplier',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'spread_ratio_with_multiplier',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'initiate_market',
        inputs: [
          {
            name: 'factual_question_Q',
            type: 'core::byte_array::ByteArray',
          },
          {
            name: 'stake',
            type: 'core::integer::u128',
          },
          {
            name: 'stance',
            type: 'core::bool',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'vote',
        inputs: [
          {
            name: 'choice_p',
            type: 'core::bool',
          },
          {
            name: 'choice_q',
            type: 'core::bool',
          },
          {
            name: 'tip_amount',
            type: 'core::integer::u128',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'settle',
        inputs: [],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'claim',
        inputs: [],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'constructor',
    name: 'constructor',
    inputs: [
      {
        name: 'voting_token_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'registry',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'olas_global_pool',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'content_identifier',
        type: 'core::byte_array::ByteArray',
      },
      {
        name: 'expiry',
        type: 'core::integer::u64',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::VOTE_CAST',
    kind: 'struct',
    members: [
      {
        name: 'voter',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'key',
      },
      {
        name: 'amount',
        type: 'core::integer::u128',
        kind: 'data',
      },
      {
        name: 'choice_p',
        type: 'core::bool',
        kind: 'data',
      },
      {
        name: 'choice_q',
        type: 'core::bool',
        kind: 'data',
      },
    ],
  },
  {
    type: 'struct',
    name: 'opinion_prediction_market::utils::common::structs::Survey',
    members: [
      {
        name: 'factual_question_Q',
        type: 'core::byte_array::ByteArray',
      },
      {
        name: 'popular_question_P',
        type: 'core::byte_array::ByteArray',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::MARKET_INITIATED',
    kind: 'struct',
    members: [
      {
        name: 'writer',
        type: 'opinion_prediction_market::utils::common::structs::Writer',
        kind: 'key',
      },
      {
        name: 'survey',
        type: 'opinion_prediction_market::utils::common::structs::Survey',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::SPA_DETERMINED',
    kind: 'struct',
    members: [
      {
        name: 'content_identifier',
        type: 'core::byte_array::ByteArray',
        kind: 'key',
      },
      {
        name: 'spread_ratio',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::MARKET_SETTLED',
    kind: 'struct',
    members: [
      {
        name: 'content_identifier',
        type: 'core::byte_array::ByteArray',
        kind: 'key',
      },
      {
        name: 'outcome',
        type: 'opinion_prediction_market::utils::common::enums::MarketOutcome',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::Event',
    kind: 'enum',
    variants: [
      {
        name: 'VOTE_CAST',
        type: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::VOTE_CAST',
        kind: 'nested',
      },
      {
        name: 'MARKET_INITIATED',
        type: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::MARKET_INITIATED',
        kind: 'nested',
      },
      {
        name: 'SPA_DETERMINED',
        type: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::SPA_DETERMINED',
        kind: 'nested',
      },
      {
        name: 'MARKET_SETTLED',
        type: 'opinion_prediction_market::contracts::core::opinion_market::opinion_market::MARKET_SETTLED',
        kind: 'nested',
      },
    ],
  },
] as const;
