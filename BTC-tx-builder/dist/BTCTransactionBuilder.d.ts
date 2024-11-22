import { TransactionResult, NetworkConfig, InscriptionTransfer } from './types';
export declare class BTCTransactionBuilder {
    private network;
    private apiBaseUrl;
    private addressType;
    constructor(config: NetworkConfig);
    /**
     * Get UTXOs for an address
     */
    private getUTXOs;
    /**
     * Get current fee rates
     */
    private getFeeRates;
    /**
     * Select UTXOs for the transaction
     */
    private selectUTXOs;
    /**
     * Build native BTC transfer transaction
     */
    buildTransfer(fromAddress: string, toAddress: string, amount: number, privateKey: string, feeRate?: number): Promise<TransactionResult>;
    /**
     * Build inscription transfer transaction
     */
    buildInscriptionTransfer(fromAddress: string, inscriptionTransfer: InscriptionTransfer, privateKey: string, feeRate?: number): Promise<TransactionResult>;
    /**
     * Broadcast signed transaction
     */
    broadcastTransaction(txHex: string): Promise<string>;
}
