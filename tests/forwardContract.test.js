/**
 * Test suite for BitForward Forward Contract System
 */

const { ForwardContract, BitForwardManager } = require('../src/index');

describe('ForwardContract', () => {
  let validContractOptions;

  beforeEach(() => {
    validContractOptions = {
      buyerAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      sellerAddress: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
      assetAmount: 1.5,
      agreedPrice: 50000,
      maturityDate: '2025-12-31T23:59:59Z'
    };
  });

  describe('Constructor', () => {
    test('should create a contract with valid options', () => {
      const contract = new ForwardContract(validContractOptions);
      
      expect(contract.buyerAddress).toBe(validContractOptions.buyerAddress);
      expect(contract.sellerAddress).toBe(validContractOptions.sellerAddress);
      expect(contract.assetAmount).toBe(validContractOptions.assetAmount);
      expect(contract.agreedPrice).toBe(validContractOptions.agreedPrice);
      expect(contract.maturityDate).toBe(validContractOptions.maturityDate);
      expect(contract.status).toBe('created');
      expect(contract.contractId).toBeDefined();
    });

    test('should generate unique contract IDs', () => {
      const contract1 = new ForwardContract(validContractOptions);
      const contract2 = new ForwardContract(validContractOptions);
      
      expect(contract1.contractId).not.toBe(contract2.contractId);
    });
  });

  describe('validate', () => {
    test('should validate a valid contract', () => {
      const contract = new ForwardContract(validContractOptions);
      expect(contract.validate()).toBe(true);
    });

    test('should throw error for missing buyer address', () => {
      const options = { ...validContractOptions };
      delete options.buyerAddress;
      const contract = new ForwardContract(options);
      
      expect(() => contract.validate()).toThrow('Buyer and seller addresses are required');
    });

    test('should throw error for missing seller address', () => {
      const options = { ...validContractOptions };
      delete options.sellerAddress;
      const contract = new ForwardContract(options);
      
      expect(() => contract.validate()).toThrow('Buyer and seller addresses are required');
    });

    test('should throw error for invalid asset amount', () => {
      const options = { ...validContractOptions, assetAmount: 0 };
      const contract = new ForwardContract(options);
      
      expect(() => contract.validate()).toThrow('Asset amount must be positive');
    });

    test('should throw error for invalid agreed price', () => {
      const options = { ...validContractOptions, agreedPrice: -1000 };
      const contract = new ForwardContract(options);
      
      expect(() => contract.validate()).toThrow('Agreed price must be positive');
    });

    test('should throw error for past maturity date', () => {
      const options = { ...validContractOptions, maturityDate: '2020-01-01T00:00:00Z' };
      const contract = new ForwardContract(options);
      
      expect(() => contract.validate()).toThrow('Maturity date must be in the future');
    });
  });

  describe('execute', () => {
    test('should execute a valid contract', () => {
      const contract = new ForwardContract(validContractOptions);
      const result = contract.execute();
      
      expect(result.success).toBe(true);
      expect(result.contractId).toBe(contract.contractId);
      expect(result.executionTime).toBeDefined();
      expect(contract.status).toBe('executed');
    });

    test('should return error for invalid contract', () => {
      const options = { ...validContractOptions, assetAmount: -1 };
      const contract = new ForwardContract(options);
      const result = contract.execute();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getDetails', () => {
    test('should return contract details', () => {
      const contract = new ForwardContract(validContractOptions);
      const details = contract.getDetails();
      
      expect(details.contractId).toBe(contract.contractId);
      expect(details.buyerAddress).toBe(validContractOptions.buyerAddress);
      expect(details.sellerAddress).toBe(validContractOptions.sellerAddress);
      expect(details.assetAmount).toBe(validContractOptions.assetAmount);
      expect(details.agreedPrice).toBe(validContractOptions.agreedPrice);
      expect(details.maturityDate).toBe(validContractOptions.maturityDate);
      expect(details.status).toBe('created');
    });
  });
});

describe('BitForwardManager', () => {
  let manager;
  let validContractOptions;

  beforeEach(() => {
    manager = new BitForwardManager();
    validContractOptions = {
      buyerAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      sellerAddress: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
      assetAmount: 1.5,
      agreedPrice: 50000,
      maturityDate: '2025-12-31T23:59:59Z'
    };
  });

  describe('createContract', () => {
    test('should create and store a contract', () => {
      const contract = manager.createContract(validContractOptions);
      
      expect(contract).toBeInstanceOf(ForwardContract);
      expect(manager.getContract(contract.contractId)).toBe(contract);
    });
  });

  describe('getContract', () => {
    test('should return contract by ID', () => {
      const contract = manager.createContract(validContractOptions);
      const retrieved = manager.getContract(contract.contractId);
      
      expect(retrieved).toBe(contract);
    });

    test('should return null for non-existent contract', () => {
      const retrieved = manager.getContract('non-existent-id');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('listContracts', () => {
    test('should return empty array when no contracts exist', () => {
      const contracts = manager.listContracts();
      
      expect(contracts).toEqual([]);
    });

    test('should return all contract details', () => {
      const contract1 = manager.createContract(validContractOptions);
      const contract2 = manager.createContract(validContractOptions);
      
      const contracts = manager.listContracts();
      
      expect(contracts).toHaveLength(2);
      expect(contracts[0].contractId).toBe(contract1.contractId);
      expect(contracts[1].contractId).toBe(contract2.contractId);
    });
  });

  describe('executeContract', () => {
    test('should execute existing contract', () => {
      const contract = manager.createContract(validContractOptions);
      const result = manager.executeContract(contract.contractId);
      
      expect(result.success).toBe(true);
      expect(result.contractId).toBe(contract.contractId);
    });

    test('should return error for non-existent contract', () => {
      const result = manager.executeContract('non-existent-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Contract not found');
    });
  });
});