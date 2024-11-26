import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { 
    NetworkConfig,
    UTXO,
    TransactionResult,
    StampData
} from '../types';
import { NetworkUtils } from '../utils/network';
import { ValidationUtils } from '../utils/validation';
import { 
    DUST_THRESHOLD,
    STAMP_PROTOCOL_ID,
    OP_RETURN_MAX_SIZE,
    ERROR_MESSAGES
} from '../constants';

const ECPair = ECPairFactory(ecc);

export class StampTransactionBuilder {
    private network: bitcoin.Network;
    private networkUtils: NetworkUtils;

    constructor(config: NetworkConfig) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new NetworkUtils(config.apiBaseUrl);
    }

    private selectUtxos(utxos: UTXO[], targetAmount: number, feeRate: number): { 
        selectedUtxos: UTXO[]; 
        totalInput: number;
        fee: number;
    } {
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
        const selectedUtxos: UTXO[] = [];
        let totalInput = 0;

        for (const utxo of sortedUtxos) {
            if (utxo.isInscription) continue;
            selectedUtxos.push(utxo);
            totalInput += utxo.value;

            // Estimate fee based on current inputs and 2 outputs (OP_RETURN + change)
            const estimatedSize = (selectedUtxos.length * 148) + 34 + 40; // P2WPKH input size + outputs
            const estimatedFee = Math.ceil(estimatedSize * feeRate);

            if (totalInput >= targetAmount + estimatedFee) {
                return { 
                    selectedUtxos, 
                    totalInput,
                    fee: estimatedFee
                };
            }
        }

        throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }

    private createStampOpReturn(stampData: StampData): Buffer {
        ValidationUtils.validateStampData(stampData);

        const stampJson = JSON.stringify({
            p: STAMP_PROTOCOL_ID,
            op: 'stamp',
            content: stampData.content,
            contentType: stampData.contentType,
            timestamp: Date.now()
        });

        const data = Buffer.from(stampJson);
        if (data.length > OP_RETURN_MAX_SIZE) {
            throw new Error(ERROR_MESSAGES.STAMP_DATA_TOO_LARGE);
        }

        return data;
    }

    async buildStampTransaction(
        fromAddress: string,
        stampData: StampData,
        privateKey: string,
        feeRate?: number
    ): Promise<TransactionResult> {
        try {
            // Validate inputs
            ValidationUtils.validateAddress(fromAddress, this.network);
            ValidationUtils.validatePrivateKey(privateKey);

            // Get UTXOs and fee rate
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            const fees = await this.networkUtils.getFeeRates();
            const selectedFeeRate = feeRate || fees.halfHourFee;

            // Initialize transaction
            const psbt = new bitcoin.Psbt({ network: this.network });
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Create OP_RETURN data
            const stampOpReturn = this.createStampOpReturn(stampData);

            // Select UTXOs
            const { selectedUtxos, totalInput, fee } = this.selectUtxos(
                utxos,
                DUST_THRESHOLD, // minimum amount needed
                selectedFeeRate
            );

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
                    stampOpReturn
                ]),
                value: 0,
            });

            // Add change output
            const change = totalInput - fee;
            if (change > DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: change,
                });
            }

            // Sign and finalize
            for (let i = 0; i < psbt.inputCount; i++) {
                psbt.signInput(i, keyPair);
                // Use ECPair.verify as the validation function
                psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                    return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                });
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);

            return {
                txHex,
                txId,
                fee,
                stampData: {
                    content: stampData.content,
                    contentType: stampData.contentType,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            throw new Error(`Stamp transaction failed: ${(error as Error).message}`);
        }
    }
}
