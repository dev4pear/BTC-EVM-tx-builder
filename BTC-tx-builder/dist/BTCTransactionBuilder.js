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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTCTransactionBuilder = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const ecc = __importStar(require("tiny-secp256k1"));
const ecpair_1 = require("ecpair");
const axios_1 = __importDefault(require("axios"));
// Initialize the required libraries
(0, bitcoinjs_lib_1.initEccLib)(ecc);
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
class BTCTransactionBuilder {
    constructor(config) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.apiBaseUrl = config.apiBaseUrl;
        this.addressType = config.addressType;
    }
    /**
     * Get UTXOs for an address
     */
    async getUTXOs(address) {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/address/${address}/utxo`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch UTXOs: ${error.message}`);
        }
    }
    /**
     * Get current fee rates
     */
    async getFeeRates() {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/fees/recommended`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch fee rates: ${error.message}`);
        }
    }
    /**
     * Select UTXOs for the transaction
     */
    selectUTXOs(utxos, amount, feeRate) {
        const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
        const selectedUtxos = [];
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
    async buildTransfer(fromAddress, toAddress, amount, privateKey, feeRate) {
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
        }
        catch (error) {
            throw new Error(`Transaction build failed: ${error.message}`);
        }
    }
    /**
     * Build inscription transfer transaction
     */
    async buildInscriptionTransfer(fromAddress, inscriptionTransfer, privateKey, feeRate) {
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
            const { selectedUtxos, fee } = this.selectUTXOs(cardinalUtxos.filter(utxo => utxo.txid !== inscriptionTransfer.inscriptionUtxo.txid), estimatedFee, selectedFeeRate);
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
        }
        catch (error) {
            throw new Error(`Inscription transfer failed: ${error.message}`);
        }
    }
    /**
     * Broadcast signed transaction
     */
    async broadcastTransaction(txHex) {
        try {
            const response = await axios_1.default.post(`${this.apiBaseUrl}/tx`, { txHex });
            return response.data.txid;
        }
        catch (error) {
            throw new Error(`Transaction broadcast failed: ${error.message}`);
        }
    }
}
exports.BTCTransactionBuilder = BTCTransactionBuilder;
//# sourceMappingURL=BTCTransactionBuilder.js.map