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
exports.btcToSatoshis = btcToSatoshis;
exports.satoshisToBtc = satoshisToBtc;
exports.calculateTxSize = calculateTxSize;
exports.sortUtxos = sortUtxos;
exports.createTransactionHex = createTransactionHex;
exports.estimateFee = estimateFee;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const networks_1 = require("../constants/networks");
function btcToSatoshis(btc) {
    return Math.floor(btc * networks_1.SAT_PER_BTC);
}
function satoshisToBtc(satoshis) {
    return satoshis / networks_1.SAT_PER_BTC;
}
function calculateTxSize(inputsCount, outputsCount, isSegwit) {
    // Basic transaction size
    let size = 10; // Version (4) + Locktime (4) + Segwit marker and flag (2)
    // Input size
    const inputSize = isSegwit ? 68 : 148; // P2WPKH input is smaller
    size += inputsCount * inputSize;
    // Output size (34 bytes per output)
    size += outputsCount * 34;
    // Add some buffer
    size += 10;
    return size;
}
function sortUtxos(utxos) {
    return [...utxos].sort((a, b) => {
        // Sort by confirmation count (confirmed first)
        if (a.confirmations && b.confirmations) {
            return b.confirmations - a.confirmations;
        }
        // Sort by value if confirmation count is the same
        return b.value - a.value;
    });
}
function createTransactionHex(inputs, outputs, network) {
    const psbt = new bitcoin.Psbt({ network: networks_1.NETWORKS[network] });
    // Add inputs
    inputs.forEach(input => {
        psbt.addInput({
            hash: input.txid,
            index: input.vout,
        });
    });
    // Add outputs
    outputs.forEach(output => {
        psbt.addOutput({
            address: output.address,
            value: output.value,
        });
    });
    return psbt.toHex();
}
function estimateFee(inputsCount, outputsCount, feeRate, isSegwit = true) {
    const txSize = calculateTxSize(inputsCount, outputsCount, isSegwit);
    return Math.ceil(txSize * feeRate);
}
//# sourceMappingURL=helpers.js.map