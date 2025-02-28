export interface StarknetDeployConfig {
  defaultNetwork: string;
  networks: NetworksConfig;
  paths: ProjectPathsConfig;
}

/**
 * @property package_name - Optional package name for the cairo project
 * @property root - Optional root directory of the project (defaults to current directory)
 * @property contractClasses - Directory where compiled contract classes are stored
 * @property scripts - Directory containing deployment and task scripts
 */
export interface ProjectPathsConfig {
  package_name?: string;
  root?: string;
  contractClasses: string;
  scripts: string;
}

export interface NetworksConfig {
  [networkName: string]: NetworkConfig;
}

export interface NetworkConfig {
  rpcUrl: string;
  accounts: string[];
  addresses: string[];
}
