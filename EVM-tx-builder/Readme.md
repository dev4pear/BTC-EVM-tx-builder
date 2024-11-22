# EVM Transaction Builder

A comprehensive TypeScript library for building and signing Ethereum (EVM) transactions, supporting ETH, ERC20, ERC721, and ERC1155 transfers.

## Features

- Native ETH transfers
- ERC20 token transfers
- ERC721 NFT transfers
- ERC1155 NFT transfers
- Transaction signing
- Gas estimation
- EIP-1559 support

## Installation

```bash
npm install evm-transaction-builder
```

## Usage

```typescript
import { EVMTransactionBuilder } from 'evm-transaction-builder';

// Initialize the builder
const builder = new EVMTransactionBuilder(
  'YOUR_RPC_URL',
  1 // chainId (1 for Ethereum mainnet)
);

// Native ETH transfer
const nativeTransfer = await builder.buildNativeTransfer(
  '0xSenderAddress',
  '0xRecipientAddress',
  '1.0', // 1 ETH
  'privateKey'
);

// ERC20 token transfer
const erc20Transfer = await builder.buildERC20Transfer(
  '0xSenderAddress',
  '0xRecipientAddress',
  '1000000000000000000', // Amount in wei
  '0xTokenContractAddress',
  'privateKey'
);

// Submit transaction
const txHash = await builder.submitTransaction(nativeTransfer.signedTx);
```

## API Documentation

### EVMTransactionBuilder

#### Constructor