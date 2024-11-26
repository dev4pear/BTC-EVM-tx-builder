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
exports.StampTransactionBuilder = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecpair_1 = require("ecpair");
const ecc = __importStar(require("tiny-secp256k1"));
const network_1 = require("../utils/network");
const validation_1 = require("../utils/validation");
const constants_1 = require("../constants");
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
class StampTransactionBuilder {
    constructor(config) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new network_1.NetworkUtils(config.apiBaseUrl);
    }
    selectUtxos(utxos, targetAmount, feeRate) {
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
        const selectedUtxos = [];
        let totalInput = 0;
        for (const utxo of sortedUtxos) {
            if (utxo.isInscription)
                continue;
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
        throw new Error(constants_1.ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    createStampOpReturn(stampData) {
        validation_1.ValidationUtils.validateStampData(stampData);
        const stampJson = JSON.stringify({
            p: constants_1.STAMP_PROTOCOL_ID,
            op: 'stamp',
            content: stampData.content,
            contentType: stampData.contentType,
            timestamp: Date.now()
        });
        const data = Buffer.from(stampJson);
        if (data.length > constants_1.OP_RETURN_MAX_SIZE) {
            throw new Error(constants_1.ERROR_MESSAGES.STAMP_DATA_TOO_LARGE);
        }
        return data;
    }
    async buildStampTransaction(fromAddress, stampData, privateKey, feeRate) {
        try {
            // Validate inputs
            validation_1.ValidationUtils.validateAddress(fromAddress, this.network);
            validation_1.ValidationUtils.validatePrivateKey(privateKey);
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
            const { selectedUtxos, totalInput, fee } = this.selectUtxos(utxos, constants_1.DUST_THRESHOLD, // minimum amount needed
            selectedFeeRate);
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
            if (change > constants_1.DUST_THRESHOLD) {
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
        }
        catch (error) {
            throw new Error(`Stamp transaction failed: ${error.message}`);
        }
    }
}
exports.StampTransactionBuilder = StampTransactionBuilder;
