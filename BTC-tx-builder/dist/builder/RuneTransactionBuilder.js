"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuneTransactionBuilder = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecpair_1 = require("ecpair");
const ecc = __importStar(require("tiny-secp256k1"));
const network_1 = require("../utils/network");
const validation_1 = require("../utils/validation");
const constants_1 = require("../constants");
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
class RuneTransactionBuilder {
    constructor(config) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new network_1.NetworkUtils(config.apiBaseUrl);
    }
    calculateTxSize(psbt) {
        const tx = psbt.extractTransaction(true);
        return tx.virtualSize();
    }
    createRuneOpReturn(runeTransfer) {
        const data = Buffer.concat([
            Buffer.from(constants_1.RUNE_PROTOCOL_ID, 'hex'),
            Buffer.from(runeTransfer.runeId),
            Buffer.from(runeTransfer.amount.toString(16).padStart(16, '0'), 'hex')
        ]);
        if (data.length > constants_1.OP_RETURN_MAX_SIZE) {
            throw new Error(constants_1.ERROR_MESSAGES.RUNE_DATA_TOO_LARGE);
        }
        return data;
    }
    async findRuneUTXO(utxos, runeId) {
        const runeUtxo = utxos.find(utxo => utxo.isRune && utxo.runeId === runeId);
        if (!runeUtxo) {
            throw new Error('Rune not found');
        }
        return runeUtxo;
    }
    async selectUTXOs(utxos, targetAmount, feeRate, runeUtxo) {
        let selectedUtxos = runeUtxo ? [runeUtxo] : [];
        let totalSelected = runeUtxo ? runeUtxo.value : 0;
        const availableUtxos = utxos.filter(utxo => !utxo.isRune &&
            (!runeUtxo || utxo.txid !== runeUtxo.txid || utxo.vout !== runeUtxo.vout));
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
        throw new Error(constants_1.ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    async buildTransaction(fromAddress, runeTransfer, privateKey, feeRate = constants_1.DEFAULT_FEE_RATE) {
        try {
            // Validate inputs
            validation_1.ValidationUtils.validateAddress(fromAddress, this.network);
            validation_1.ValidationUtils.validatePrivateKey(privateKey);
            validation_1.ValidationUtils.validateRuneTransfer(runeTransfer);
            // Get UTXOs and validate rune balance
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            const runeUtxo = await this.findRuneUTXO(utxos, runeTransfer.runeId);
            // Create keyPair
            const keyPair = ECPair.fromWIF(privateKey, this.network);
            // Initialize PSBT
            const psbt = new bitcoin.Psbt({ network: this.network });
            // Select UTXOs for the transaction
            const { selectedUtxos, totalSelected, fee } = await this.selectUTXOs(utxos, constants_1.DUST_THRESHOLD, // We only need dust amount for the rune transfer
            feeRate, runeUtxo);
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
                value: constants_1.DUST_THRESHOLD
            });
            // Add change output if needed
            const changeAmount = totalSelected - constants_1.DUST_THRESHOLD - fee;
            if (changeAmount >= constants_1.DUST_THRESHOLD) {
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
        }
        catch (error) {
            throw new Error(`Rune transfer failed: ${error.message}`);
        }
    }
}
exports.RuneTransactionBuilder = RuneTransactionBuilder;
