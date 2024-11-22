import {
    ethers,
    TransactionRequest,
    Interface,
    JsonRpcProvider,
    FeeData
} from 'ethers';
import { EVMSigner } from './EVMSigner';
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from './constants/abi';
import { TransactionResult, TransactionOptions, NFTTransferOptions } from './types';

export class EVMTransactionBuilder {
    private provider: JsonRpcProvider;
    private signer: EVMSigner;
    private chainId: number;

    constructor(rpcUrl: string, chainId: number) {
        this.provider = new JsonRpcProvider(rpcUrl);
        this.signer = new EVMSigner(this.provider);
        this.chainId = chainId;
    }

    /**
     * Get current gas price and nonce
     */
    private async getTransactionParams(from: string): Promise<{
        nonce: number;
        feeData: FeeData;
    }> {
        const [nonce, feeData] = await Promise.all([
            this.provider.getTransactionCount(from),
            this.provider.getFeeData(),
        ]);
        return { nonce, feeData };
    }

    /**
     * Calculate estimated gas cost
     */
    private calculateGasCost(gasLimit: bigint, maxFeePerGas: bigint | null): string {
        const fee = maxFeePerGas || BigInt(0);
        return (gasLimit * fee).toString();
    }

    /**
     * Build native ETH transfer transaction
     */
    async buildNativeTransfer(
        from: string,
        to: string,
        amount: string,
        privateKey: string,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);
            const gasLimit = options?.gasLimit || BigInt(21000);
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));

            const tx: TransactionRequest = {
                from,
                to,
                value: ethers.parseEther(amount),
                nonce,
                chainId: this.chainId,
                type: 2,
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas: options?.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
            };

            const signedTx = await this.signer.signWithPrivateKey(tx, privateKey);

            return {
                signedTx,
                raw: tx,
                estimatedGasCost: this.calculateGasCost(gasLimit, maxFeePerGas),
            };
        } catch (error) {
            throw new Error(`Native transfer build failed: ${(error as Error).message}`);
        }
    }

    /**
     * Build ERC20 token transfer transaction
     */
    async buildERC20Transfer(
        from: string,
        to: string,
        amount: string,
        tokenAddress: string,
        privateKey: string,
        options?: TransactionOptions
    ): Promise<TransactionResult> {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);

            const erc20Interface = new Interface(ERC20_ABI);
            const data = erc20Interface.encodeFunctionData('transfer', [to, amount]);

            const estimatedGas = await this.provider.estimateGas({
                from,
                to: tokenAddress,
                data,
            });

            const gasLimit = options?.gasLimit || estimatedGas;
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));

            const tx: TransactionRequest = {
                from,
                to: tokenAddress,
                data,
                nonce,
                chainId: this.chainId,
                type: 2,
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas: options?.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
            };

            const signedTx = await this.signer.signWithPrivateKey(tx, privateKey);

            return {
                signedTx,
                raw: tx,
                estimatedGasCost: this.calculateGasCost(BigInt(gasLimit.toString()), maxFeePerGas),
            };
        } catch (error) {
            throw new Error(`ERC20 transfer build failed: ${(error as Error).message}`);
        }
    }

    /**
     * Build ERC721 NFT transfer transaction
     */
    async buildERC721Transfer(
        from: string,
        to: string,
        tokenId: string,
        contractAddress: string,
        privateKey: string,
        options?: NFTTransferOptions
    ): Promise<TransactionResult> {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);

            const erc721Interface = new Interface(ERC721_ABI);
            const methodName = options?.safe ? 'safeTransferFrom' : 'transferFrom';
            const data = erc721Interface.encodeFunctionData(methodName, [from, to, tokenId]);

            const estimatedGas = await this.provider.estimateGas({
                from,
                to: contractAddress,
                data,
            });

            const gasLimit = options?.gasLimit || estimatedGas;
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));

            const tx: TransactionRequest = {
                from,
                to: contractAddress,
                data,
                nonce,
                chainId: this.chainId,
                type: 2,
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas: options?.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
            };

            const signedTx = await this.signer.signWithPrivateKey(tx, privateKey);

            return {
                signedTx,
                raw: tx,
                estimatedGasCost: this.calculateGasCost(BigInt(gasLimit.toString()), maxFeePerGas),
            };
        } catch (error) {
            throw new Error(`ERC721 transfer build failed: ${(error as Error).message}`);
        }
    }

    /**
     * Build ERC1155 NFT transfer transaction
     */
    async buildERC1155Transfer(
        from: string,
        to: string,
        tokenId: string,
        amount: string,
        contractAddress: string,
        privateKey: string,
        options?: NFTTransferOptions
    ): Promise<TransactionResult> {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);

            const erc1155Interface = new Interface(ERC1155_ABI);
            const data = erc1155Interface.encodeFunctionData('safeTransferFrom', [
                from,
                to,
                tokenId,
                amount,
                options?.data || '0x',
            ]);

            const estimatedGas = await this.provider.estimateGas({
                from,
                to: contractAddress,
                data,
            });

            const gasLimit = options?.gasLimit || estimatedGas;
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));

            const tx: TransactionRequest = {
                from,
                to: contractAddress,
                data,
                nonce,
                chainId: this.chainId,
                type: 2,
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas: options?.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas,
            };

            const signedTx = await this.signer.signWithPrivateKey(tx, privateKey);

            return {
                signedTx,
                raw: tx,
                estimatedGasCost: this.calculateGasCost(BigInt(gasLimit.toString()), maxFeePerGas),
            };
        } catch (error) {
            throw new Error(`ERC1155 transfer build failed: ${(error as Error).message}`);
        }
    }

    /**
     * Submit a signed transaction
     */
    async submitTransaction(signedTx: string): Promise<string> {
        try {
            const tx = await this.provider.broadcastTransaction(signedTx);
            return tx.hash;
        } catch (error) {
            throw new Error(`Transaction submission failed: ${(error as Error).message}`);
        }
    }
}