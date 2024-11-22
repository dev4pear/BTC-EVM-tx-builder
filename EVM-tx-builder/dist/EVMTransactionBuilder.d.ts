import { TransactionResult, TransactionOptions, NFTTransferOptions } from './types';
export declare class EVMTransactionBuilder {
    private provider;
    private signer;
    private chainId;
    constructor(rpcUrl: string, chainId: number);
    /**
     * Get current gas price and nonce
     */
    private getTransactionParams;
    /**
     * Calculate estimated gas cost
     */
    private calculateGasCost;
    /**
     * Build native ETH transfer transaction
     */
    buildNativeTransfer(from: string, to: string, amount: string, privateKey: string, options?: TransactionOptions): Promise<TransactionResult>;
    /**
     * Build ERC20 token transfer transaction
     */
    buildERC20Transfer(from: string, to: string, amount: string, tokenAddress: string, privateKey: string, options?: TransactionOptions): Promise<TransactionResult>;
    /**
     * Build ERC721 NFT transfer transaction
     */
    buildERC721Transfer(from: string, to: string, tokenId: string, contractAddress: string, privateKey: string, options?: NFTTransferOptions): Promise<TransactionResult>;
    /**
     * Build ERC1155 NFT transfer transaction
     */
    buildERC1155Transfer(from: string, to: string, tokenId: string, amount: string, contractAddress: string, privateKey: string, options?: NFTTransferOptions): Promise<TransactionResult>;
    /**
     * Submit a signed transaction
     */
    submitTransaction(signedTx: string): Promise<string>;
}
