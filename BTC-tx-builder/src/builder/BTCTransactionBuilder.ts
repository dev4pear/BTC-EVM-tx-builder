import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import {
    NetworkConfig,
    UTXO,
    TransactionResult,
    InscriptionTransfer,
    ValidationResult
} from '../types';
import { NetworkUtils } from '../utils/network';
import { ValidationUtils } from '../utils/validation';
import {
    DUST_THRESHOLD,
    DEFAULT_FEE_RATE,
    ERROR_MESSAGES
} from '../constants'

const ECPair = ECPairFactory(ecc);

export class BTCTransactionBuilder {
    private network: bitcoin.Network;
    private networkUtils: NetworkUtils;

    constructor(config: NetworkConfig) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new NetworkUtils(config.apiBaseUrl);
    }

    private calculateTxSize(psbt: bitcoin.Psbt): number {
        const tx = psbt.extractTransaction(true);
        return tx.virtualSize();
    }

    private async selectUTXOs(utxos: UTXO[], targetAmount: number, feeRate: number): Promise<{
        selectedUtxos: UTXO[];
        totalSelected: number;
        fee: number;
    }> {
        let selectedUtxos: UTXO[] = [];
        let totalSelected = 0;
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);

        // First, try to find a single UTXO that covers the amount plus estimated fees
        for (const utxo of sortedUtxos) {
            const estimatedFee = Math.ceil((148 + 34 + 10) * feeRate); // Simple estimation for single input
            if (utxo.value >= targetAmount + estimatedFee) {
                return {
                    selectedUtxos: [utxo],
                    totalSelected: utxo.value,
                    fee: estimatedFee
                };
            }
        }

        // If no single UTXO is sufficient, accumulate multiple UTXOs
        for (const utxo of sortedUtxos) {
            if (!utxo.isInscription) { // Skip inscription UTXOs for regular transactions
                selectedUtxos.push(utxo);
                totalSelected += utxo.value;

                const estimatedFee = Math.ceil((selectedUtxos.length * 148 + 34 + 10) * feeRate);
                if (totalSelected >= targetAmount + estimatedFee) {
                    return {
                        selectedUtxos,
                        totalSelected,
                        fee: estimatedFee
                    };
                }
            }
        }

        throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }

    private async findInscriptionUTXO(utxos: UTXO[], inscriptionId: string): Promise<UTXO> {
        const inscriptionUtxo = utxos.find(utxo => utxo.inscriptionId === inscriptionId);
        if (!inscriptionUtxo) {
            throw new Error(ERROR_MESSAGES.INSCRIPTION_NOT_FOUND);
        }
        return inscriptionUtxo;
    }

    async buildTransaction(
        fromAddress: string,
        toAddress: string,
        amount: number,
        privateKey: string,
        feeRate: number = DEFAULT_FEE_RATE
    ): Promise<TransactionResult> {
        try {
            // Validate inputs
            ValidationUtils.validateAddress(fromAddress, this.network);
            ValidationUtils.validateAddress(toAddress, this.network);
            ValidationUtils.validateAmount(amount);
            ValidationUtils.validatePrivateKey(privateKey);

            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            if (!utxos.length) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            const { selectedUtxos, totalSelected, fee } = await this.selectUTXOs(utxos, amount, feeRate);
            const change = totalSelected - amount - fee;

            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Add inputs
            for (const utxo of selectedUtxos) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value
                    }
                });
            }

            // Add outputs
            psbt.addOutput({
                address: toAddress,
                value: amount
            });

            if (change > DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change
                });
            }

            // Sign and validate
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, keyPair);
                const input = psbt.data.inputs[i];
                if (input.partialSig && input.partialSig.length > 0) {
                    psbt.validateSignaturesOfInput(i, (pubkey: Buffer, msghash: Buffer, signature: Buffer) => {
                        return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                    });
                }
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);

            return { txHex, txId, fee };
        } catch (error) {
            throw new Error(`Transaction failed: ${(error as Error).message}`);
        }
    }

    async buildInscriptionTransfer(
        fromAddress: string,
        inscriptionTransfer: InscriptionTransfer,
        privateKey: string,
        feeRate: number = DEFAULT_FEE_RATE
    ): Promise<TransactionResult> {
        try {
            // Validate inputs
            ValidationUtils.validateAddress(fromAddress, this.network);
            ValidationUtils.validateAddress(inscriptionTransfer.destinationAddress, this.network);
            ValidationUtils.validatePrivateKey(privateKey);

            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            if (!utxos.length) {
                throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }

            // Find inscription UTXO
            const inscriptionUtxo = await this.findInscriptionUTXO(utxos, inscriptionTransfer.inscriptionId);
            const nonInscriptionUtxos = utxos.filter(utxo => !utxo.isInscription);

            // Calculate fees and select additional UTXOs if needed
            const baseFee = Math.ceil((148 + 34 + 10) * feeRate);
            let additionalUtxos: UTXO[] = [];
            let totalAdditional = 0;
            let actualFee = baseFee;

            if (inscriptionUtxo.value < DUST_THRESHOLD) {
                const needed = DUST_THRESHOLD - inscriptionUtxo.value + baseFee;
                const { selectedUtxos, totalSelected, fee } = await this.selectUTXOs(nonInscriptionUtxos, needed, feeRate);
                additionalUtxos = selectedUtxos;
                totalAdditional = totalSelected;
                actualFee = fee;
            }

            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Add inscription input first
            psbt.addInput({
                hash: inscriptionUtxo.txid,
                index: inscriptionUtxo.vout,
                witnessUtxo: {
                    script: Buffer.from(inscriptionUtxo.scriptPubKey, 'hex'),
                    value: inscriptionUtxo.value
                }
            });

            // Add additional inputs if needed
            for (const utxo of additionalUtxos) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value
                    }
                });
            }

            // Add outputs
            psbt.addOutput({
                address: inscriptionTransfer.destinationAddress,
                value: inscriptionUtxo.value
            });

            const change = totalAdditional - actualFee;
            if (change > DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change
                });
            }

            // Sign and validate
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, keyPair);
                const input = psbt.data.inputs[i];
                if (input.partialSig && input.partialSig.length > 0) {
                    psbt.validateSignaturesOfInput(i, (pubkey: Buffer, msghash: Buffer, signature: Buffer) => {
                        return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                    });
                }
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);

            return { txHex, txId, fee: actualFee };
        } catch (error) {
            throw new Error(`Inscription transfer failed: ${(error as Error).message}`);
        }
    }
}
