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
exports.SAT_PER_BTC = exports.DUST_AMOUNT = exports.DEFAULT_LOCKTIME = exports.DEFAULT_SEQUENCE = exports.API_ENDPOINTS = exports.NETWORKS = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
exports.NETWORKS = {
    mainnet: bitcoin.networks.bitcoin,
    testnet: bitcoin.networks.testnet
};
exports.API_ENDPOINTS = {
    mainnet: 'https://mempool.space/api',
    testnet: 'https://mempool.space/testnet/api'
};
exports.DEFAULT_SEQUENCE = 0xfffffffe; // RBF enabled
exports.DEFAULT_LOCKTIME = 0;
exports.DUST_AMOUNT = 546; // Minimum output value in satoshis
exports.SAT_PER_BTC = 100000000;
//# sourceMappingURL=networks.js.map