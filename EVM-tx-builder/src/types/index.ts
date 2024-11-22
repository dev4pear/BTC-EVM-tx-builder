import { TransactionRequest } from 'ethers';

export interface TransactionResult {
    signedTx: string;
    hash?: string;
    raw: TransactionRequest;
    estimatedGasCost: string;
}

export interface TransactionOptions {
    gasLimit?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}

export interface NFTTransferOptions extends TransactionOptions {
    safe?: boolean;
    data?: string;
}