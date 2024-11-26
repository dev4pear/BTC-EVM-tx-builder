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
exports.BTCTransactionBuilder = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecpair_1 = require("ecpair");
const ecc = __importStar(require("tiny-secp256k1"));
const network_1 = require("../utils/network");
const validation_1 = require("../utils/validation");
const constants_1 = require("../constants");
const ECPair = (0, ecpair_1.ECPairFactory)(ecc);
class BTCTransactionBuilder {
    constructor(config) {
        this.network = config.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
        this.networkUtils = new network_1.NetworkUtils(config.apiBaseUrl);
    }
    calculateTxSize(psbt) {
        const tx = psbt.extractTransaction(true);
        return tx.virtualSize();
    }
    async selectUTXOs(utxos, targetAmount, feeRate) {
        let selectedUtxos = [];
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
        throw new Error(constants_1.ERROR_MESSAGES.INSUFFICIENT_FUNDS);
    }
    async findInscriptionUTXO(utxos, inscriptionId) {
        const inscriptionUtxo = utxos.find(utxo => utxo.inscriptionId === inscriptionId);
        if (!inscriptionUtxo) {
            throw new Error(constants_1.ERROR_MESSAGES.INSCRIPTION_NOT_FOUND);
        }
        return inscriptionUtxo;
    }
    async buildTransaction(fromAddress, toAddress, amount, privateKey, feeRate = constants_1.DEFAULT_FEE_RATE) {
        try {
            // Validate inputs
            validation_1.ValidationUtils.validateAddress(fromAddress, this.network);
            validation_1.ValidationUtils.validateAddress(toAddress, this.network);
            validation_1.ValidationUtils.validateAmount(amount);
            validation_1.ValidationUtils.validatePrivateKey(privateKey);
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            if (!utxos.length) {
                throw new Error(constants_1.ERROR_MESSAGES.INSUFFICIENT_FUNDS);
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
            if (change > constants_1.DUST_THRESHOLD) {
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
                    psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                        return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                    });
                }
            }
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);
            return { txHex, txId, fee };
        }
        catch (error) {
            throw new Error(`Transaction failed: ${error.message}`);
        }
    }
    async buildInscriptionTransfer(fromAddress, inscriptionTransfer, privateKey, feeRate = constants_1.DEFAULT_FEE_RATE) {
        try {
            // Validate inputs
            validation_1.ValidationUtils.validateAddress(fromAddress, this.network);
            validation_1.ValidationUtils.validateAddress(inscriptionTransfer.destinationAddress, this.network);
            validation_1.ValidationUtils.validatePrivateKey(privateKey);
            const utxos = await this.networkUtils.getUTXOs(fromAddress);
            if (!utxos.length) {
                throw new Error(constants_1.ERROR_MESSAGES.INSUFFICIENT_FUNDS);
            }
            // Find inscription UTXO
            const inscriptionUtxo = await this.findInscriptionUTXO(utxos, inscriptionTransfer.inscriptionId);
            const nonInscriptionUtxos = utxos.filter(utxo => !utxo.isInscription);
            // Calculate fees and select additional UTXOs if needed
            const baseFee = Math.ceil((148 + 34 + 10) * feeRate);
            let additionalUtxos = [];
            let totalAdditional = 0;
            let actualFee = baseFee;
            if (inscriptionUtxo.value < constants_1.DUST_THRESHOLD) {
                const needed = constants_1.DUST_THRESHOLD - inscriptionUtxo.value + baseFee;
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
            if (change > constants_1.DUST_THRESHOLD) {
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
                    psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
                        return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
                    });
                }
            }
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = await this.networkUtils.broadcastTransaction(txHex);
            return { txHex, txId, fee: actualFee };
        }
        catch (error) {
            throw new Error(`Inscription transfer failed: ${error.message}`);
        }
    }
}
exports.BTCTransactionBuilder = BTCTransactionBuilder;
