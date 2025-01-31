import { promises as fs } from 'fs';
import * as fileUtils from '../fileUtils';
import { describe, expect, test, beforeEach, it, jest } from '@jest/globals';
import toml from 'toml';
import path from 'path';

// Mock toml
jest.mock('toml', () => ({
  parse: jest.fn(),
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

  describe('fetchContractAddress', () => {
    it('should return contract address from json file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify({ TestContract: '0x123' }) as never,
      );

      const address = await fileUtils.fetchContractAddress('TestContract');
      expect(address).toBe('0x123');
    });

    it('should throw error if contract not found', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('{}' as never);

      const address = await fileUtils.fetchContractAddress(
        'NonExistentContract',
      );
      expect(address).toBeUndefined();
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
      (fs.readFile as jest.Mock).mockImplementation((filePath: any) => {
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
  describe('saveContractAddress', () => {
    it('should save contract address to json file', async () => {
      const mockReadFile = fs.readFile as jest.Mock;
      mockReadFile.mockResolvedValue('{}' as never);

      await fileUtils.saveContractAddress('TestContract', '0x123');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('deployed_contract_addresses.json'),
        expect.stringContaining('"TestContract": "0x123"'),
      );
    });
    it('should append to existing addresses', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(
        '{"ExistingContract": "0x456"}' as never,
      );
      await fileUtils.saveContractAddress('TestContract', '0x123');
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
