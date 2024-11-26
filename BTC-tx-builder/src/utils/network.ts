import axios from 'axios';
import { UTXO, FeeRates } from '../types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../constants';
import { run } from 'node:test';

export class NetworkUtils {
    private apiBaseUrl: string;

    constructor(apiBaseUrl: string) {
        this.apiBaseUrl = apiBaseUrl;
    }

    async getUTXOs(address: string): Promise<UTXO[]> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/address/${address}/utxo`);
            return response.data.map((utxo: any) => ({
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value,
                scriptPubKey: utxo.scriptPubKey,
                isInscription: utxo.isInscription || false,
                inscriptionId: utxo.inscriptionId
            }));
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR}: ${(error as Error).message}`);
        }
    }

    async getFeeRates(): Promise<FeeRates> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/fees/recommended`);
            return {
                fastestFee: response.data.fastestFee,
                halfHourFee: response.data.halfHourFee,
                hourFee: response.data.hourFee
            };
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR}: ${(error as Error).message}`);
        }
    }
    async getRuneBalance(address: string, runeId: string): Promise<number> {
        const response = await axios.post(`/address/${address}/rune/${runeId}/balance`);
        return response.data;
    }

    async broadcastTransaction(txHex: string): Promise<string> {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/tx`, txHex);
            return response.data;
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.BROADCAST_FAILED}: ${(error as Error).message}`);
        }
    }
}
