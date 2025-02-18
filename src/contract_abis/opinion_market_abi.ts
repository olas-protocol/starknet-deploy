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

export default abi;
