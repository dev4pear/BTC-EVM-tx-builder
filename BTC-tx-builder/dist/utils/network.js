"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
class NetworkUtils {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }
    async getUTXOs(address) {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/address/${address}/utxo`);
            return response.data.map((utxo) => ({
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value,
                scriptPubKey: utxo.scriptPubKey,
                isInscription: utxo.isInscription || false,
                inscriptionId: utxo.inscriptionId
            }));
        }
        catch (error) {
            throw new Error(`${constants_1.ERROR_MESSAGES.NETWORK_ERROR}: ${error.message}`);
        }
    }
    async getFeeRates() {
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/fees/recommended`);
            return {
                fastestFee: response.data.fastestFee,
                halfHourFee: response.data.halfHourFee,
                hourFee: response.data.hourFee
            };
        }
        catch (error) {
            throw new Error(`${constants_1.ERROR_MESSAGES.NETWORK_ERROR}: ${error.message}`);
        }
    }
    async getRuneBalance(address, runeId) {
        const response = await axios_1.default.post(`/address/${address}/rune/${runeId}/balance`);
        return response.data;
    }
    async broadcastTransaction(txHex) {
        try {
            const response = await axios_1.default.post(`${this.apiBaseUrl}/tx`, txHex);
            return response.data;
        }
        catch (error) {
            throw new Error(`${constants_1.ERROR_MESSAGES.BROADCAST_FAILED}: ${error.message}`);
        }
    }
}
exports.NetworkUtils = NetworkUtils;
