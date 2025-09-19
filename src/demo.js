/**
 * BitForward Demo
 * 
 * This file demonstrates how to use the BitForward system
 * to create and manage forward contracts.
 */

const { ForwardContract, BitForwardManager } = require('./index');

// Initialize the BitForward manager
const manager = new BitForwardManager();

// Example usage
console.log('🚀 BitForward - Forward Contract Demo\n');

// Create a sample forward contract
const contractOptions = {
  buyerAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  sellerAddress: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
  assetAmount: 1.5, // 1.5 BTC
  agreedPrice: 50000, // $50,000 USD
  maturityDate: '2025-12-31T23:59:59Z'
};

try {
  console.log('📋 Creating forward contract...');
  const contract = manager.createContract(contractOptions);
  
  console.log('✅ Contract created successfully!');
  console.log('📄 Contract Details:');
  console.log(JSON.stringify(contract.getDetails(), null, 2));
  
  console.log('\n🔍 Listing all contracts:');
  const allContracts = manager.listContracts();
  console.log(JSON.stringify(allContracts, null, 2));
  
  console.log('\n⚡ Executing contract...');
  const executionResult = manager.executeContract(contract.contractId);
  console.log('📊 Execution Result:');
  console.log(JSON.stringify(executionResult, null, 2));
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n🎉 Demo completed!');