import type {
  Abi,
  ExtractAbiFunctions,
  FunctionRet,
} from 'abi-wan-kanabi/kanabi';

export type AbiStateMutability = 'view' | 'external';

export type ExtractFunctionNames<
  TAbi extends Abi,
  TStateMutability extends AbiStateMutability,
> = Extract<
  ExtractAbiFunctions<TAbi>,
  { state_mutability: TStateMutability }
>['name'];

// Union types of all possible call options across all contracts
export type FunctionResponse<
  TAbi extends Abi,
  TFunctionName extends ExtractAbiFunctions<TAbi>['name'],
> = FunctionRet<TAbi, TFunctionName>;

export type ExtractAbiConstructor<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: 'constructor' }
>;
