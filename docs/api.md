# API Reference

## Classes

### ForwardContract

Represents a forward contract with specified terms.

#### Constructor

```javascript
new ForwardContract(options)
```

**Parameters:**
- `options` (Object): Contract configuration
  - `buyerAddress` (string): Bitcoin address of the buyer
  - `sellerAddress` (string): Bitcoin address of the seller
  - `assetAmount` (number): Amount of asset to be traded
  - `agreedPrice` (number): Agreed price for the asset
  - `maturityDate` (string): ISO date string for contract maturity

#### Methods

##### `validate()`

Validates the contract parameters.

**Returns:** `boolean` - True if contract is valid

**Throws:** `Error` - If validation fails

##### `execute()`

Executes the forward contract.

**Returns:** `Object`
- `success` (boolean): Execution success status
- `contractId` (string): Contract identifier (if successful)
- `executionTime` (string): ISO timestamp of execution (if successful)
- `error` (string): Error message (if failed)

##### `getDetails()`

Returns the contract details.

**Returns:** `Object`
- `contractId` (string): Unique contract identifier
- `buyerAddress` (string): Buyer's Bitcoin address
- `sellerAddress` (string): Seller's Bitcoin address
- `assetAmount` (number): Asset amount
- `agreedPrice` (number): Agreed price
- `maturityDate` (string): Maturity date
- `status` (string): Contract status

##### `createScript()`

Creates the Bitcoin Script for the contract.

**Returns:** `Buffer` - Bitcoin Script buffer

### BitForwardManager

Manages multiple forward contracts.

#### Constructor

```javascript
new BitForwardManager()
```

#### Methods

##### `createContract(contractOptions)`

Creates a new forward contract.

**Parameters:**
- `contractOptions` (Object): Contract configuration (see ForwardContract constructor)

**Returns:** `ForwardContract` - The created contract instance

##### `getContract(contractId)`

Retrieves a contract by its ID.

**Parameters:**
- `contractId` (string): Contract identifier

**Returns:** `ForwardContract|null` - Contract instance or null if not found

##### `listContracts()`

Lists all managed contracts.

**Returns:** `Array<Object>` - Array of contract details

##### `executeContract(contractId)`

Executes a contract by its ID.

**Parameters:**
- `contractId` (string): Contract identifier

**Returns:** `Object` - Execution result (see ForwardContract.execute())

## Examples

### Basic Contract Creation

```javascript
const { BitForwardManager } = require('bitforward');

const manager = new BitForwardManager();
const contract = manager.createContract({
  buyerAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  sellerAddress: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
  assetAmount: 1.0,
  agreedPrice: 45000,
  maturityDate: '2025-06-30T23:59:59Z'
});
```

### Error Handling

```javascript
try {
  const result = contract.execute();
  if (result.success) {
    console.log('Contract executed successfully');
  } else {
    console.error('Execution failed:', result.error);
  }
} catch (error) {
  console.error('Validation error:', error.message);
}
```