import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { 
    NetworkConfig, 
    UTXO, 
    TransactionResult,
    RuneTransfer
} from '../types';
import { NetworkUtils } from '../utils/network';
import { ValidationUtils } from '../utils/validation';
import { 
    DUST_THRESHOLD,
    DEFAULT_FEE_RATE,
    RUNE_PROTOCOL_ID,
    OP_RETURN_MAX_SIZE,
    ERROR_MESSAGES 
} from '../constants';

const ECPair = ECPairFactory(ecc);

export class RuneTransactionBuilder {
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

    private createRuneOpReturn(runeTransfer: RuneTransfer): Buffer {
        const data = Buffer.concat([
            Buffer.from(RUNE_PROTOCOL_ID, 'hex'),
            Buffer.from(runeTransfer.runeId),
            Buffer.from(runeTransfer.amount.toString(16).padStart(16, '0'), 'hex')
        ]);

        if (data.length > OP_RETURN_MAX_SIZE) {
            throw new Error(ERROR_MESSAGES.RUNE_DATA_TOO_LARGE);
        }

        return data;
    }

    private async findRuneUTXO(utxos: UTXO[], runeId: string): Promise<UTXO> {
        const runeUtxo = utxos.find(utxo => utxo.isRune && utxo.runeId === runeId);
        if (!runeUtxo) {
            throw new Error('Rune not found');
        }
        return runeUtxo;
    }

    private async selectUTXOs(
        utxos: UTXO[], 
        targetAmount: number, 
        feeRate: number,
        runeUtxo?: UTXO
    ): Promise<{
        selectedUtxos: UTXO[];
        totalSelected: number;
        fee: number;
    }> {
        let selectedUtxos: UTXO[] = runeUtxo ? [runeUtxo] : [];
        let totalSelected = runeUtxo ? runeUtxo.value : 0;
        
        const availableUtxos = utxos.filter(utxo => 
            !utxo.isRune && 
            (!runeUtxo || utxo.txid !== runeUtxo.txid || utxo.vout !== runeUtxo.vout)
        );
        
        const sortedUtxos = [...availableUtxos].sort((a, b) => b.value - a.value);

        for (const utxo of sortedUtxos) {
            selectedUtxos.push(utxo);
            totalSelected += utxo.value;

            const estimatedSize = (selectedUtxos.length * 148) + 34 + 40; // Additional size for OP_RETURN
            const estimatedFee = Math.ceil(estimatedSize * feeRate);

            if (totalSelected >= targetAmount + estimatedFee) {
                return {
                    selectedUtxos,
                    totalSelected,
                    fee: estimatedFee
                };
            }
        }

        throw new Error(ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }

    async buildTransaction(
        fromAddress: string,
        runeTransfer: RuneTransfer,
        privateKey: string,
        feeRate: number = DEFAULT_FEE_RATE
    ): Promise<TransactionResult> {
        try {
            // Validate inputs
            ValidationUtils.validateAddress(fromAddress, this.network);
            ValidationUtils.validatePrivateKey(privateKey);
            ValidationUtils.validateRuneTransfer(runeTransfer);

            // Get UTXOs and validate rune balance
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            const runeUtxo = await this.findRuneUTXO(utxos, runeTransfer.runeId);

            // Create keyPair
            const keyPair = ECPair.fromWIF(privateKey, this.network);

            // Initialize PSBT
            const psbt = new bitcoin.Psbt({ network: this.network });

            // Select UTXOs for the transaction
            const { selectedUtxos, totalSelected, fee } = await this.selectUTXOs(
                utxos,
                DUST_THRESHOLD, // We only need dust amount for the rune transfer
                feeRate,
                runeUtxo
            );

            // Add inputs
            for (const utxo of selectedUtxos) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value,
                    }
                });
            }

            // Add OP_RETURN output
            const opReturnData = this.createRuneOpReturn(runeTransfer);
            psbt.addOutput({
                script: bitcoin.script.compile([
                    bitcoin.opcodes.OP_RETURN,
                    opReturnData
                ]),
                value: 0
            });

            // Add recipient output
            psbt.addOutput({
                address: runeTransfer.destinationAddress,
                value: DUST_THRESHOLD
            });

            // Add change output if needed
            const changeAmount = totalSelected - DUST_THRESHOLD - fee;
            if (changeAmount >= DUST_THRESHOLD) {
                psbt.addOutput({
                    address: fromAddress,
                    value: changeAmount
                });
            }

            // Sign all inputs
            selectedUtxos.forEach((_, index) => {
                psbt.signInput(index, keyPair);
            });

            // Finalize and extract transaction
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = tx.getId();

            // Broadcast transaction
            await this.networkUtils.broadcastTransaction(txHex);

            return {
                txHex,
                txId,
                fee,
                runeTransfer: {
                    runeId: runeTransfer.runeId,
                    amount: runeTransfer.amount,
                    from: fromAddress,
                    to: runeTransfer.destinationAddress
                }
            };

        } catch (error) {
            throw new Error(`Rune transfer failed: ${(error as Error).message}`);
        }
    }
}
