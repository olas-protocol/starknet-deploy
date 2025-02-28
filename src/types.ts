export interface StarknetDeployConfig {
  defaultNetwork: string;
  networks: NetworksConfig;
  paths: ProjectPathsConfig;
}

export interface ProjectPathsConfig {
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
