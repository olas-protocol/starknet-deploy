import { logError } from './logger';

export const explorerURL = `starkscan.co`;

/**
 * Converts a given number of days into a future Unix timestamp by adding to the current timestamp.
 * @param days - The number of days to add to the current timestamp.
 * @returns The future timestamp in seconds representing the current time plus the given days.
 */
export function generateFutureTimestamp(days: number): number {
  // 1 day = 24 hours * 60 minutes * 60 seconds
  const secondsPerDay = 24 * 60 * 60;
  // Get the current timestamp in seconds
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Calculate the future timestamp in seconds
  const futureTimestamp = currentTimestamp + days * secondsPerDay;
  return futureTimestamp;
}
/**
 * Gets the explorer URL for a transaction
 * @param txHash The transaction hash
 * @returns The explorer URL or just the hash if no explorer URL is configured
 */
export function getExplorerUrl(network: string, txHash: string): string {
  switch (network) {
    case 'sepolia':
      return `https://sepolia.${explorerURL}/tx/${txHash}`;
    case 'mainnet':
      return `https://${explorerURL}/tx/${txHash}`;
    default:
      return txHash;
  }
}

/**
 * Logs an error message
 * @param message The message to log
 */
export function handleError(message: string): void {
  logError(message);
  throw new Error(message);
}

export function replacer(_: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  } else {
    return value;
  }
}
