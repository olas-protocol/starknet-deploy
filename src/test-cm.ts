import { opinion_market, registry, voting_token } from './contract_abis';
import { initializeContractManager } from './ContractManager';
// Example of how to use it
async function example() {
  const contractManager = initializeContractManager();

  const result = await contractManager.executeTransaciton({
    abi: voting_token,
    contract: 'voting_token',
    functionName: 'approve', // literal so that TypeScript knows which function you're referring to
    args: ['0xRecipient', '12345'], // autocomplete should now show the proper expected type, if the ABI is typed correctly
    options: { bufferPercentage: 20 },
  });
}

example();
