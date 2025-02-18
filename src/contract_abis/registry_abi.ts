const abi = [
  {
    type: 'impl',
    name: 'IRegistryImpl',
    interface_name:
      'opinion_prediction_market::interfaces::IRegistry::IRegistry',
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
    type: 'interface',
    name: 'opinion_prediction_market::interfaces::IRegistry::IRegistry',
    items: [
      {
        type: 'function',
        name: 'is_verified_writer',
        inputs: [
          {
            name: 'writer',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'is_verified_user',
        inputs: [
          {
            name: 'user',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'event',
    name: 'opinion_prediction_market::contracts::registry::registry::Event',
    kind: 'enum',
    variants: [],
  },
] as const;

export default abi;
