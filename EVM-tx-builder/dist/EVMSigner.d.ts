import { Provider, TransactionRequest } from 'ethers';
export declare class EVMSigner {
    private provider;
    constructor(provider: Provider);
    /**
     * Sign a transaction with a private key
     */
    signWithPrivateKey(unsignedTx: TransactionRequest, privateKey: string): Promise<string>;
    /**
     * Sign a message (not a transaction)
     */
    signMessage(message: string, privateKey: string): Promise<string>;
}
