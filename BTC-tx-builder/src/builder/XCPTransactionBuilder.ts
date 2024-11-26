import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { 
    NetworkConfig, 
    UTXO, 
    TransactionResult,
    XCPTransfer 
} from '../types';
import { NetworkUtils } from '../utils/network';
import { ValidationUtils } from '../utils/validation';
import { 
    DUST_THRESHOLD,
    XCP_PROTOCOL_ID,
    OP_RETURN_MAX_SIZE,
    ERROR_MESSAGES 
} from '../constants';

const ECPair = ECPairFactory(ecc);

export class XCPTransactionBuilder {
    private network: bitcoin.Network;
    private networkUtils: NetworkUtils;

    constructor(config: NetworkConfig) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new NetworkUtils(config.apiBaseUrl);
    }

    private estimateVsize(psbt: bitcoin.Psbt): number {
        // Clone the PSBT to avoid modifying the original
        const psbtClone = bitcoin.Psbt.fromBase64(psbt.toBase64());
        
        // Estimate input size (assuming P2WPKH inputs)
        const inputSize = psbtClone.data.inputs.length * 98; // ~98 bytes per P2WPKH input
        
        // Estimate output size
        const outputSize = psbtClone.txOutputs.length * 43; // ~43 bytes per output
        
        // Add transaction overhead
        const overhead = 10; // Version, locktime, etc.
        
        // Calculate total virtual size (vsize)
        return Math.ceil(overhead + inputSize + outputSize);
    }

    private selectUtxos(utxos: UTXO[], amount: number, feeRate: number): { 
        selectedUtxos: UTXO[]; 
        totalInput: number 
    } {
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
        const selectedUtxos: UTXO[] = [];
        let totalInput = 0;
        const estimatedFee = Math.ceil(bitcoin.Transaction.DEFAULT_SEQUENCE * feeRate);
        const targetAmount = amount + estimatedFee;

        for (const utxo of sortedUtxos) {
            if (utxo.isInscription) continue;
            selectedUtxos.push(utxo);
            totalInput += utxo.value;
            if (totalInput >= targetAmount) break;
        }

        return { selectedUtxos, totalInput };
    }

    private createXCPOpReturn(xcpTransfer: XCPTransfer): Buffer {
        // Validate XCP transfer data
        if (!xcpTransfer.asset || !xcpTransfer.amount || xcpTransfer.amount <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_XCP_DATA);
        }

        const xcpData = {
            p: XCP_PROTOCOL_ID,
            op: 'send',
            asset: xcpTransfer.asset,
            qty: xcpTransfer.amount.toString(),
            memo: xcpTransfer.memo || ''
        };

        const data = Buffer.from(JSON.stringify(xcpData));
        if (data.length > OP_RETURN_MAX_SIZE) {
            throw new Error("XCP Too large data");
        }

        return data;
    }

    async buildXCPTransfer(
        fromAddress: string,
        xcpTransfer: XCPTransfer,
        privateKey: string,
        feeRate?: number
    ): Promise<TransactionResult> {
        // Validate inputs
        ValidationUtils.validateAddress(fromAddress, this.network);
        ValidationUtils.validateAddress(xcpTransfer.destinationAddress, this.network);
        ValidationUtils.validatePrivateKey(privateKey);

        try {
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            const fees = await this.networkUtils.getFeeRates();
            const selectedFeeRate = feeRate || fees.halfHourFee;

            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Create OP_RETURN data for XCP transfer
            const xcpOpReturn = this.createXCPOpReturn(xcpTransfer);

            // Select UTXOs and calculate amounts
            const { selectedUtxos, totalInput } = this.selectUtxos(utxos, DUST_THRESHOLD * 2, selectedFeeRate);
            
            if (!selectedUtxos.length) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            // Add inputs
            selectedUtxos.forEach(utxo => {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value,
                    },
                });
            });

            // Add OP_RETURN output
            psbt.addOutput({
                script: bitcoin.script.compile([
                    bitcoin.opcodes.OP_RETURN,
                    xcpOpReturn
                ]),
                value: 0,
            });

            // Add recipient output with dust
            psbt.addOutput({
                address: xcpTransfer.destinationAddress,
                value: DUST_THRESHOLD,
            });

            // Calculate and add change if needed
            const fee = Math.ceil(this.estimateVsize(psbt) * selectedFeeRate);
            const change = totalInput - DUST_THRESHOLD - fee;
            
            if (change > DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change,
                });
            }

            // Sign and finalize with proper signature validation
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, keyPair);
                psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                    return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                });
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);

            return { txHex, txId, fee };
        } catch (error) {
            throw new Error(`XCP transfer failed: ${(error as Error).message}`);
        }
    }

    async buildXCPIssuance(
        fromAddress: string,
        assetName: string,
        amount: number,
        description: string,
        privateKey: string,
        feeRate?: number
    ): Promise<TransactionResult> {
        // Validate inputs
        ValidationUtils.validateAddress(fromAddress, this.network);
        ValidationUtils.validatePrivateKey(privateKey);
        
        if (!assetName || !amount || amount <= 0) {
            throw new Error('INVALID ISSUANCE DATA');
        }

        try {
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            const fees = await this.networkUtils.getFeeRates();
            const selectedFeeRate = feeRate || fees.halfHourFee;

            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Create issuance data
            const issuanceData = {
                p: XCP_PROTOCOL_ID,
                op: 'issuance',
                asset: assetName,
                qty: amount.toString(),
                description
            };

            const opReturnData = Buffer.from(JSON.stringify(issuanceData));
            if (opReturnData.length > OP_RETURN_MAX_SIZE) {
                throw new Error('ISSUANCE DATA TOO LARGE');
            }

            // Select UTXOs and calculate amounts
            const { selectedUtxos, totalInput } = this.selectUtxos(utxos, DUST_THRESHOLD, selectedFeeRate);
            
            if (!selectedUtxos.length) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            // Add inputs
            selectedUtxos.forEach(utxo => {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value,
                    },
                });
            });

            // Add OP_RETURN output
            psbt.addOutput({
                script: bitcoin.script.compile([
                    bitcoin.opcodes.OP_RETURN,
                    opReturnData
                ]),
                value: 0,
            });

            // Calculate and add change if needed
            const fee = Math.ceil(this.estimateVsize(psbt) * selectedFeeRate);
            const change = totalInput - fee;
            
            if (change > DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change,
                });
            }

            // Sign and finalize with proper signature validation
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, keyPair);
                psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                    return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                });
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);

            return { txHex, txId, fee };
        } catch (error) {
            throw new Error(`XCP issuance failed: ${(error as Error).message}`);
        }
    }
}
