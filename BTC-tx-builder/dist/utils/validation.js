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
exports.isValidAddress = isValidAddress;
exports.isValidAmount = isValidAmount;
exports.isValidPrivateKey = isValidPrivateKey;
exports.isValidTxId = isValidTxId;
exports.validateTransactionInputs = validateTransactionInputs;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const networks_1 = require("../constants/networks");
function isValidAddress(address, network) {
    try {
        bitcoin.address.toOutputScript(address, networks_1.NETWORKS[network]);
        return true;
    }
    catch (error) {
        return false;
    }
}
function isValidAmount(amount) {
    return Number.isInteger(amount) && amount > 0;
}
function isValidPrivateKey(privateKey) {
    try {
        return privateKey.length === 64 || (privateKey.length === 52 && privateKey.startsWith('K'));
    }
    catch (error) {
        return false;
    }
}
function isValidTxId(txid) {
    return /^[a-fA-F0-9]{64}$/.test(txid);
}
function validateTransactionInputs(fromAddress, toAddress, amount, network) {
    if (!isValidAddress(fromAddress, network)) {
        throw new Error('Invalid sender address');
    }
    if (!isValidAddress(toAddress, network)) {
        throw new Error('Invalid recipient address');
    }
    if (!isValidAmount(amount)) {
        throw new Error('Invalid amount');
    }
}
//# sourceMappingURL=validation.js.map