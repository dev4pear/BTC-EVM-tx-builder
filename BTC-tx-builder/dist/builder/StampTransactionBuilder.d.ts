import { NetworkConfig, TransactionResult, StampData } from '../types';
export declare class StampTransactionBuilder {
    private network;
    private networkUtils;
    constructor(config: NetworkConfig);
    private selectUtxos;
    private createStampOpReturn;
    buildStampTransaction(fromAddress: string, stampData: StampData, privateKey: string, feeRate?: number): Promise<TransactionResult>;
}
