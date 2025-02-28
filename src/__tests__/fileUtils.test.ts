import { promises as fs } from 'fs';
import * as fileUtils from '../fileUtils';
import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import toml from 'toml';
import path from 'path';

// Mock toml
jest.mock('toml', () => ({
  parse: jest.fn(),
}));

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    defaultNetwork: 'testnet',
    networks: {
      testnet: {
        rpcUrl: 'http://localhost:5050',
        accounts: ['0x123'],
        addresses: ['0x456'],
      },
      sepolia: {
        rpcUrl: 'http://localhost:5050',
        accounts: ['0x123'],
        addresses: ['0x456'],
      },
    },
    paths: {
      contractClasses: 'target/dev',
      scripts: 'src/scripts',
    },
  },
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
  existsSync: jest.fn(),
}));

describe('FileUtils', () => {
  beforeEach(() => {
    // 1. Clear all mocks
    jest.clearAllMocks();

    // 2. Mock file read for Scarb.toml
    (fs.readFile as jest.Mock).mockResolvedValue(
      '[package]\nname = "test_project"' as never,
    );

    // 3. Mock toml parser
    (toml.parse as jest.Mock).mockReturnValue({
      package: { name: 'test_project' },
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      await fileUtils.ensureDirectoryExists('test/dir');
      expect(fs.mkdir).toHaveBeenCalledWith('test/dir', { recursive: true });
    });
  });

  describe('getPackageName', () => {
    it('should return package name from Scarb.toml', async () => {
      const packageName = await fileUtils.getPackageName();
      expect(packageName).toBe('test_project');
    });

    it('should throw error if Scarb.toml is invalid', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('File not found') as never,
      );

      await expect(fileUtils.getPackageName()).rejects.toThrow(
        'File not found',
      );
    });
  });
  describe('getCompiledCode', () => {
    it('should return sierra and casm code', async () => {
      // Setup mock data
      const mockSierra = { sierra: 'code' };
      const mockCasm = { casm: 'code' };
      const mockPackageName = 'test_project';
      const contractName = 'ERC20';
      const projectRoot = process.cwd();
      // Setup file paths
      const sierraFilePath = path.join(
        projectRoot,
        'target/dev',
        `${mockPackageName}_${contractName}.contract_class.json`,
      );
      const scarbPath = path.join(projectRoot, 'Scarb.toml');

      const casmFilePath = path.join(
        projectRoot,
        'target/dev',
        `${mockPackageName}_${contractName}.compiled_contract_class.json`,
      );

      //Mock Implementation
      (fs.readFile as jest.Mock).mockImplementation((filePath: unknown) => {
        switch (filePath) {
          case scarbPath:
            return Promise.resolve('[package]\nname = `${mockPackageName}`');
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
      (toml.parse as jest.Mock).mockReturnValue({
        package: { name: mockPackageName },
      });

      const code = await fileUtils.getCompiledCode(contractName);

      expect(code.sierraCode).toEqual(mockSierra);
      expect(code.casmCode).toEqual(mockCasm);
    });

    it('should throw error if compiled files not found', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('File not found') as never,
      );

      await expect(fileUtils.getCompiledCode('TestContract')).rejects.toThrow();
    });
  });

  describe('fetchContractAddress', () => {
    it('should return contract address from json file', async () => {
      const mockPath = path.join(
        process.cwd(),
        'src/scripts/deployments/testnet',
        'deployed_contract_addresses.json',
      );

      (fs.readFile as jest.Mock).mockImplementation((filePath) => {
        expect(filePath).toBe(mockPath);
        return Promise.resolve(JSON.stringify({ TestContract: '0x123' }));
      });

      const address = await fileUtils.fetchContractAddress(
        'TestContract',
        'testnet',
      );
      expect(address).toBe('0x123');
      expect(fs.readFile).toHaveBeenCalledWith(mockPath, 'utf8');
    });

    it('should return undefined if contract not found in the file', async () => {
      const mockPath = path.join(
        process.cwd(),
        'src/scripts/deployments/testnet',
        'deployed_contract_addresses.json',
      );

      (fs.readFile as jest.Mock).mockImplementation((filePath) => {
        expect(filePath).toBe(mockPath);
        return Promise.resolve(JSON.stringify({ AnotherContract: '0x456' }));
      });

      const contractName = 'NonExistentContract';
      const address = await fileUtils.fetchContractAddress(
        contractName,
        'testnet',
      );
      expect(address).toBeUndefined();
      expect(fs.readFile).toHaveBeenCalledWith(mockPath, 'utf8');
    });

    it('should handle different networks correctly', async () => {
      const mockMainnetPath = path.join(
        process.cwd(),
        'src/scripts/deployments/mainnet',
        'deployed_contract_addresses.json',
      );

      (fs.readFile as jest.Mock).mockImplementation((filePath) => {
        expect(filePath).toBe(mockMainnetPath);
        return Promise.resolve(JSON.stringify({ TestContract: '0xabc' }));
      });

      const address = await fileUtils.fetchContractAddress(
        'TestContract',
        'mainnet',
      );
      expect(address).toBe('0xabc');
      expect(fs.readFile).toHaveBeenCalledWith(mockMainnetPath, 'utf8');
    });
  });
  describe('saveContractAddress', () => {
    it('should save contract address to json file', async () => {
      const mockReadFile = fs.readFile as jest.Mock;
      mockReadFile.mockResolvedValue('{}' as never);

      await fileUtils.saveContractAddress('TestContract', '0x123', 'testnet');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('deployed_contract_addresses.json'),
        expect.stringContaining('"TestContract": "0x123"'),
      );
    });
    it('should append to existing addresses', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        '{"ExistingContract": "0x456"}' as never,
      );
      await fileUtils.saveContractAddress('TestContract', '0x123', 'testnet');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"ExistingContract": "0x456"'),
      );
    });
  });

  describe('createProjectStructure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create project structure using paths from config', async () => {
      // Get direct reference to the mocked config
      const mockConfig = require('../config').default;
      const mockMkdir = fs.mkdir as jest.Mock;
      const mockWriteFile = fs.writeFile as jest.Mock;
      const projectRoot = process.cwd();

      await fileUtils.createProjectStructure();

      // Verify directories are created using config paths
      expect(mockMkdir).toHaveBeenCalledWith(
        path.join(projectRoot, mockConfig.paths.scripts, 'deployments'),
        { recursive: true },
      );
      expect(mockMkdir).toHaveBeenCalledWith(
        path.join(projectRoot, mockConfig.paths.scripts, 'tasks'),
        { recursive: true },
      );

      // Verify example files are created at config-specified paths
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(
          projectRoot,
          mockConfig.paths.scripts,
          'tasks',
          'example_task.ts',
        ),
        fileUtils.exampleTaskContent,
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join(
          projectRoot,
          mockConfig.paths.scripts,
          'deployments',
          'example_deployment.ts',
        ),
        fileUtils.exampleDeploymentScript,
      );
    });
  });
});
