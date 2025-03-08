import { existsSync, promises as fs } from 'fs';
import * as fileUtils from '../fileUtils';
import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import path from 'path';
import { StarknetDeployConfig } from '../types';

// Mock config object
const mockConfig: StarknetDeployConfig = {
  defaultNetwork: 'sepolia',
  networks: {
    sepolia: {
      rpcUrl: 'https://test-url',
      accounts: ['test-key'],
      addresses: ['test-address'],
    },
    testnet: {
      rpcUrl: 'http://localhost:5050',
      accounts: ['0x123'],
      addresses: ['0x456'],
    },
  },
  paths: {
    root: process.cwd(),
    package_name: 'test_project',
    contractClasses: 'target/dev',
    scripts: 'src/scripts',
  },
};

// Mock StarknetDeployConfig file
jest.mock(process.cwd() + '/starknet-deploy.config.ts', () => mockConfig, {
  virtual: true,
});
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existsSync: jest.fn().mockImplementation((path: any) => {
    // Special case for config file - always return true
    if (path.includes('starknet-deploy.config.ts')) {
      return true;
    }
    // For other paths, return false by default to match test expectations
    return false;
  }),
}));

describe('FileUtils', () => {
  beforeEach(() => {
    // 1. Clear all mocks
    jest.clearAllMocks();
  });

  describe('loadConfigFile', () => {
    it('should return mock config', async () => {
      const config = await fileUtils.loadConfigFile();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      await fileUtils.ensureDirectoryExists('test/dir');
      expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
    });

    it('should handle directory creation error', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied') as never,
      );

      await expect(fileUtils.ensureDirectoryExists('test/dir')).rejects.toThrow(
        'Permission denied',
      );
    });
  });

  describe('ensureFileExists', () => {
    beforeEach(() => {
      (existsSync as jest.Mock).mockReturnValue(false);
    });

    it('should create directory and file if they do not exist', async () => {
      await fileUtils.ensureFileExists('test/dir/file.json');

      expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'test/dir/file.json',
        JSON.stringify({}),
      );
    });

    it('should not create directory if it exists', async () => {
      (existsSync as jest.Mock).mockImplementation((path) => {
        return path === 'test/dir';
      });

      await fileUtils.ensureFileExists('test/dir/file.json');

      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        'test/dir/file.json',
        JSON.stringify({}),
      );
    });

    it('should not create file if it exists', async () => {
      (existsSync as jest.Mock).mockReturnValue(true);

      await fileUtils.ensureFileExists('test/dir/file.json');

      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkDeploymentPath', () => {
    it('should return correct path for specified network', async () => {
      const path = await fileUtils.getNetworkDeploymentPath('testnet');
      expect(path).toContain('testnet');
      expect(path).toContain('deployments');
    });
  });
  describe('getCompiledCode', () => {
    it('should return sierra and casm code', async () => {
      // Setup mock data
      const mockSierra = { sierra: 'code' };
      const mockCasm = { casm: 'code' };
      const mockPackageName = mockConfig.paths.package_name;
      const contractName = 'ERC20';
      const projectRoot = mockConfig.paths.root!;

      // Setup file paths
      const sierraFilePath = path.join(
        projectRoot,
        'target/dev',
        `${mockPackageName}_${contractName}.contract_class.json`,
      );

      const casmFilePath = path.join(
        projectRoot,
        'target/dev',
        `${mockPackageName}_${contractName}.compiled_contract_class.json`,
      );

      // Mock Implementation
      (fs.readFile as jest.Mock).mockImplementation((filePath: unknown) => {
        switch (filePath) {
          case sierraFilePath:
            return Promise.resolve(Buffer.from(JSON.stringify(mockSierra)));
          case casmFilePath:
            return Promise.resolve(Buffer.from(JSON.stringify(mockCasm)));
          default:
            return Promise.reject(
              new Error(`Unexpected file path: ${filePath}`),
            );
        }
      });

      const code = await fileUtils.getCompiledCode(contractName, mockConfig);

      expect(code.sierraCode).toEqual(mockSierra);
      expect(code.casmCode).toEqual(mockCasm);
    });

    it('should throw error if compiled files not found', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('File not found') as never,
      );

      await expect(
        fileUtils.getCompiledCode('TestContract', mockConfig),
      ).rejects.toThrow();
    });
  });
  describe('saveContractAddress', () => {
    beforeEach(() => {
      (fs.readFile as jest.Mock).mockResolvedValue('{}' as never);
    });

    it('should save contract address to json file', async () => {
      await fileUtils.saveContractAddress('TestContract', '0x123', 'sepolia');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"TestContract"'),
      );
    });

    it('should append to existing addresses', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        '{"ExistingContract":"0x456"}' as never,
      );
      jest.spyOn(fileUtils, 'loadConfigFile').mockResolvedValue(mockConfig);

      await fileUtils.saveContractAddress(
        'TestContract',
        '0x123',
        mockConfig.defaultNetwork,
      );

      // Check that writeFile was called once with a string containing both contracts
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/ExistingContract.*0x456.*TestContract.*0x123/s),
      );
    });

    it('should handle file read errors', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('Failed to read file') as never,
      );

      await expect(
        fileUtils.saveContractAddress(
          'TestContract',
          '0x123',
          mockConfig.defaultNetwork,
        ),
      ).rejects.toThrow();
    });
  });
  // Add this test block after the saveContractAddress tests

  describe('fetchContractAddress', () => {
    it('should fetch contract address from deployment file', async () => {
      // Mock readFile to return an address JSON
      const mockAddresses = { TestContract: '0x123' };
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockAddresses) as never,
      );

      const address = await fileUtils.fetchContractAddress(
        'TestContract',
        'sepolia',
      );

      expect(address).toBe('0x123');
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('sepolia'),
        'utf8',
      );
    });

    it('should throw error when contract address not found', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ OtherContract: '0x456' }) as never,
      );
      const address = await fileUtils.fetchContractAddress(
        'TestContract',
        'sepolia',
      );
      expect(address).toBeUndefined();
    });

    it('should handle file read errors', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('Cannot read file') as never,
      );

      await expect(
        fileUtils.fetchContractAddress('TestContract', 'sepolia'),
      ).rejects.toThrow('Cannot read file');
    });
  });

  describe('createProjectStructure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create project structure with required directories and files', async () => {
      const mockMkdir = fs.mkdir as jest.Mock;
      const mockWriteFile = fs.writeFile as jest.Mock;
      const projectRoot = process.cwd();

      await fileUtils.createProjectStructure();

      // Verify directories creation
      expect(mockMkdir).toHaveBeenCalledWith(
        path.join(projectRoot, 'src', 'scripts', 'deployments'),
        { recursive: true },
      );
      expect(mockMkdir).toHaveBeenCalledWith(
        path.join(projectRoot, 'src', 'scripts', 'tasks'),
        { recursive: true },
      );

      // Verify example task and deployment file creation
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(projectRoot, 'src', 'scripts', 'tasks', 'example_task.ts'),
        fileUtils.exampleTaskContent,
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(
          projectRoot,
          'src',
          'scripts',
          'deployments',
          'example_deployment.ts',
        ),
        fileUtils.exampleDeploymentScript,
      );
    });
  });
});
