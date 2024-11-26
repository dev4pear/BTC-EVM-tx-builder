import { NetworkConfig, TransactionResult, RuneTransfer } from '../types';
export declare class RuneTransactionBuilder {
    private network;
    private networkUtils;
    constructor(config: NetworkConfig);
    private calculateTxSize;
    private createRuneOpReturn;
    private findRuneUTXO;
    private selectUTXOs;
    buildTransaction(fromAddress: string, runeTransfer: RuneTransfer, privateKey: string, feeRate?: number): Promise<TransactionResult>;
}
