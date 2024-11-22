import { EVMTransactionBuilder } from '../src';

describe('EVMTransactionBuilder', () => {
    const rpcUrl = 'YOUR_RPC_URL';
    const chainId = 1;
    const builder = new EVMTransactionBuilder(rpcUrl, chainId);

    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const mockPrivateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    test('should build native transfer transaction', async () => {
        const result = await builder.buildNativeTransfer(
            mockAddress,
            mockAddress,
            '1.0',
            mockPrivateKey
        );

        expect(result).toHaveProperty('signedTx');
        expect(result).toHaveProperty('raw');
        expect(result).toHaveProperty('estimatedGasCost');
    });

    // Add more tests for other transaction types
});