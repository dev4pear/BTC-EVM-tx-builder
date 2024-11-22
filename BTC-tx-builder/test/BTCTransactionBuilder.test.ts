import { BTCTransactionBuilder } from '../src/BTCTransactionBuilder';
import { NetworkConfig } from '../src/types';

describe('BTCTransactionBuilder', () => {
    let builder: BTCTransactionBuilder;
    const config: NetworkConfig = {
        network: 'testnet',
        addressType: 'p2wpkh',
        apiBaseUrl: 'https://mempool.space/testnet/api'
    };

    beforeEach(() => {
        builder = new BTCTransactionBuilder(config);
    });

    test('should create instance with correct network', () => {
        expect(builder).toBeInstanceOf(BTCTransactionBuilder);
    });

    test('should build native transfer transaction', async () => {
        // Mock implementation
        const mockBuildTransfer = jest.spyOn(builder, 'buildTransfer');
        mockBuildTransfer.mockResolvedValue({
            txHex: 'mock_tx_hex',
            txId: 'mock_tx_id',
            fee: 1000
        });

        const result = await builder.buildTransfer(
            'tb1qtest',
            'tb1qtest2',
            10000,
            'testPrivateKey'
        );

        expect(result).toHaveProperty('txHex');
        expect(result).toHaveProperty('txId');
        expect(result).toHaveProperty('fee');
    });

    // Add more tests as needed
});