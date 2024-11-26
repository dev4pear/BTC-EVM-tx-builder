import { NetworkConfig, TransactionResult, InscriptionTransfer } from '../types';
export declare class BTCTransactionBuilder {
    private network;
    private networkUtils;
    constructor(config: NetworkConfig);
    private calculateTxSize;
    private selectUTXOs;
    private findInscriptionUTXO;
    buildTransaction(fromAddress: string, toAddress: string, amount: number, privateKey: string, feeRate?: number): Promise<TransactionResult>;
    buildInscriptionTransfer(fromAddress: string, inscriptionTransfer: InscriptionTransfer, privateKey: string, feeRate?: number): Promise<TransactionResult>;
}
