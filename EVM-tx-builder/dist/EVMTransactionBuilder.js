"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMTransactionBuilder = void 0;
const ethers_1 = require("ethers");
const EVMSigner_1 = require("./EVMSigner");
const abi_1 = require("./constants/abi");
class EVMTransactionBuilder {
    constructor(rpcUrl, chainId) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.signer = new EVMSigner_1.EVMSigner(this.provider);
        this.chainId = chainId;
    }
    /**
     * Get current gas price and nonce
     */
    async getTransactionParams(from) {
        const [nonce, feeData] = await Promise.all([
            this.provider.getTransactionCount(from),
            this.provider.getFeeData(),
        ]);
        return { nonce, feeData };
    }
    /**
     * Calculate estimated gas cost
     */
    calculateGasCost(gasLimit, maxFeePerGas) {
        const fee = maxFeePerGas || BigInt(0);
        return (gasLimit * fee).toString();
    }
    /**
     * Build native ETH transfer transaction
     */
    async buildNativeTransfer(from, to, amount, privateKey, options) {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);
            const gasLimit = options?.gasLimit || BigInt(21000);
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));
            const tx = {
                from,
                to,
                value: ethers_1.ethers.parseEther(amount),
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
        }
        catch (error) {
            throw new Error(`Native transfer build failed: ${error.message}`);
        }
    }
    /**
     * Build ERC20 token transfer transaction
     */
    async buildERC20Transfer(from, to, amount, tokenAddress, privateKey, options) {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);
            const erc20Interface = new ethers_1.Interface(abi_1.ERC20_ABI);
            const data = erc20Interface.encodeFunctionData('transfer', [to, amount]);
            const estimatedGas = await this.provider.estimateGas({
                from,
                to: tokenAddress,
                data,
            });
            const gasLimit = options?.gasLimit || estimatedGas;
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));
            const tx = {
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
        }
        catch (error) {
            throw new Error(`ERC20 transfer build failed: ${error.message}`);
        }
    }
    /**
     * Build ERC721 NFT transfer transaction
     */
    async buildERC721Transfer(from, to, tokenId, contractAddress, privateKey, options) {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);
            const erc721Interface = new ethers_1.Interface(abi_1.ERC721_ABI);
            const methodName = options?.safe ? 'safeTransferFrom' : 'transferFrom';
            const data = erc721Interface.encodeFunctionData(methodName, [from, to, tokenId]);
            const estimatedGas = await this.provider.estimateGas({
                from,
                to: contractAddress,
                data,
            });
            const gasLimit = options?.gasLimit || estimatedGas;
            const maxFeePerGas = options?.maxFeePerGas || (feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : BigInt(0));
            const tx = {
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
        }
        catch (error) {
            throw new Error(`ERC721 transfer build failed: ${error.message}`);
        }
    }
    /**
     * Build ERC1155 NFT transfer transaction
     */
    async buildERC1155Transfer(from, to, tokenId, amount, contractAddress, privateKey, options) {
        try {
            const { nonce, feeData } = await this.getTransactionParams(from);
            const erc1155Interface = new ethers_1.Interface(abi_1.ERC1155_ABI);
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
            const tx = {
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
        }
        catch (error) {
            throw new Error(`ERC1155 transfer build failed: ${error.message}`);
        }
    }
    /**
     * Submit a signed transaction
     */
    async submitTransaction(signedTx) {
        try {
            const tx = await this.provider.broadcastTransaction(signedTx);
            return tx.hash;
        }
        catch (error) {
            throw new Error(`Transaction submission failed: ${error.message}`);
        }
    }
}
exports.EVMTransactionBuilder = EVMTransactionBuilder;
