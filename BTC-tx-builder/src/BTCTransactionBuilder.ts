import * as bitcoin from 'bitcoinjs-lib';
import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import axios from 'axios';
import {
    UTXO,
    TransactionResult,
    NetworkConfig,
    FeeRates,
    InscriptionTransfer
} from './types';

// Initialize the required libraries
initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export class BTCTransactionBuilder {
    private network: bitcoin.Network;
    private apiBaseUrl: string;
    private addressType: 'p2wpkh' | 'p2tr';

    constructor(config: NetworkConfig) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.apiBaseUrl = config.apiBaseUrl;
        this.addressType = config.addressType;
    }

    /**
     * Get UTXOs for an address
     */
    private async getUTXOs(address: string): Promise<UTXO[]> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/address/${address}/utxo`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch UTXOs: ${(error as Error).message}`);
        }
    }

    /**
     * Get current fee rates
     */
    private async getFeeRates(): Promise<FeeRates> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/fees/recommended`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch fee rates: ${(error as Error).message}`);
        }
    }

    /**
     * Select UTXOs for the transaction
     */
    private selectUTXOs(utxos: UTXO[], amount: number, feeRate: number): {
        selectedUtxos: UTXO[];
        fee: number;
        change: number;
    } {
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
        const selectedUtxos: UTXO[] = [];
        let totalSelected = 0;

        // Estimate initial fee with 2 outputs (recipient + change)
        const estimatedVSize = 140; // Approximate vsize for 1-in-2-out P2WPKH
        const estimatedFee = Math.ceil(estimatedVSize * feeRate);

        for (const utxo of sortedUtxos) {
            selectedUtxos.push(utxo);
            totalSelected += utxo.value;

            if (totalSelected >= amount + estimatedFee) {
                break;
            }
        }

        if (totalSelected < amount + estimatedFee) {
            throw new Error('Insufficient funds');
        }

        return {
            selectedUtxos,
            fee: estimatedFee,
            change: totalSelected - amount - estimatedFee
        };
    }

    /**
     * Build native BTC transfer transaction
     */
    async buildTransfer(
        fromAddress: string,
        toAddress: string,
        amount: number,
        privateKey: string,
        feeRate?: number
    ): Promise<TransactionResult> {
        try {
            const utxos = await this.getUTXOs(fromAddress);
            const fees = await this.getFeeRates();
            const selectedFeeRate = feeRate || fees.halfHourFee;

            const { selectedUtxos, fee, change } = this.selectUTXOs(utxos, amount, selectedFeeRate);

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

            if (change > 0) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change
                });
            }

            // Sign all inputs
            selectedUtxos.forEach((_, index) => {
                psbt.signInput(index, keyPair);
            });

            psbt.finalizeAllInputs();

            const tx = psbt.extractTransaction();

            return {
                txHex: tx.toHex(),
                txId: tx.getId(),
                fee
            };
        } catch (error) {
            throw new Error(`Transaction build failed: ${(error as Error).message}`);
        }
    }

    /**
     * Build inscription transfer transaction
     */
    async buildInscriptionTransfer(
        fromAddress: string,
        inscriptionTransfer: InscriptionTransfer,
        privateKey: string,
        feeRate?: number
    ): Promise<TransactionResult> {
        try {
            const fees = await this.getFeeRates();
            const selectedFeeRate = feeRate || fees.halfHourFee;

            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Add inscription input
            psbt.addInput({
                hash: inscriptionTransfer.inscriptionUtxo.txid,
                index: inscriptionTransfer.inscriptionUtxo.vout,
                witnessUtxo: {
                    script: Buffer.from(inscriptionTransfer.inscriptionUtxo.scriptPubKey, 'hex'),
                    value: inscriptionTransfer.inscriptionUtxo.value
                }
            });

            // Add cardinal UTXOs for fee
            const estimatedFee = Math.ceil(200 * selectedFeeRate); // Approximate vsize for inscription transfer
            const cardinalUtxos = await this.getUTXOs(fromAddress);
            const { selectedUtxos, fee } = this.selectUTXOs(
                cardinalUtxos.filter(utxo => utxo.txid !== inscriptionTransfer.inscriptionUtxo.txid),
                estimatedFee,
                selectedFeeRate
            );

            selectedUtxos.forEach(utxo => {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value
                    }
                });
            });

            // Add inscription output
            psbt.addOutput({
                address: inscriptionTransfer.destinationAddress,
                value: inscriptionTransfer.inscriptionUtxo.value
            });

            // Add change output if needed
            const totalCardinalInput = selectedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
            const change = totalCardinalInput - fee;

            if (change > 0) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change
                });
            }

            // Sign all inputs
            for (let i = 0; i < psbt.txInputs.length; i++) {
                psbt.signInput(i, keyPair);
            }

            psbt.finalizeAllInputs();

            const tx = psbt.extractTransaction();

            return {
                txHex: tx.toHex(),
                txId: tx.getId(),
                fee
            };
        } catch (error) {
            throw new Error(`Inscription transfer failed: ${(error as Error).message}`);
        }
    }

    /**
     * Broadcast signed transaction
     */
    async broadcastTransaction(txHex: string): Promise<string> {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/tx`, { txHex });
            return response.data.txid;
        } catch (error) {
            throw new Error(`Transaction broadcast failed: ${(error as Error).message}`);
        }
    }
}