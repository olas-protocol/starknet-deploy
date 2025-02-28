import colors from 'colors';
import { BigNumberish } from 'starknet';
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}
const explorerURL = `https://starkscan.co/`;

// Format the log message
function formatLog(level: LogLevel, message: string): string {
  return `\n[${level}] ${message}`;
}

export function logInfo(message: string) {
  console.log(colors.blue(formatLog(LogLevel.INFO, message)));
}

export function logWarn(message: string) {
  console.log(colors.yellow(formatLog(LogLevel.WARN, message)));
}

export function logError(message: string) {
  console.error(colors.red(formatLog(LogLevel.ERROR, message)));
}
export function logSuccess(message: string) {
  console.log(colors.green(formatLog(LogLevel.SUCCESS, message)));
}

/**
 * Logs deployment details to the console.
 *
 * @param contractName - The name of the deployed contract.
 * @param classHash - The class hash of the deployed contract.
 * @param contractAddress - The address of the deployed contract.
 */

export function logDeploymentDetails(
  contractName: string,
  classHash: BigNumberish,
  contractAddress: string,
) {
  const deploymentMessage = `
    ${colors.green(`${contractName} Contract deployed successfully`)}
    ${colors.green(`Class Hash: ${classHash}`)}
    ${colors.green(`Contract Address: ${contractAddress}`)}
    ${colors.green(`Explorer URL: ${explorerURL}/contract/${contractAddress}`)}
    `;
  logSuccess(deploymentMessage);
}
