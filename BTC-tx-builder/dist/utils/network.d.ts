import { UTXO, FeeRates } from '../types';
export declare class NetworkUtils {
    private apiBaseUrl;
    constructor(apiBaseUrl: string);
    getUTXOs(address: string): Promise<UTXO[]>;
    getFeeRates(): Promise<FeeRates>;
    getRuneBalance(address: string, runeId: string): Promise<number>;
    broadcastTransaction(txHex: string): Promise<string>;
}
