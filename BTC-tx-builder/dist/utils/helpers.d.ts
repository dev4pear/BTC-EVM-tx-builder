import { UTXO } from '../types';
export declare function btcToSatoshis(btc: number): number;
export declare function satoshisToBtc(satoshis: number): number;
export declare function calculateTxSize(inputsCount: number, outputsCount: number, isSegwit: boolean): number;
export declare function sortUtxos(utxos: UTXO[]): UTXO[];
export declare function createTransactionHex(inputs: {
    txid: string;
    vout: number;
}[], outputs: {
    address: string;
    value: number;
}[], network: 'mainnet' | 'testnet'): string;
export declare function estimateFee(inputsCount: number, outputsCount: number, feeRate: number, isSegwit?: boolean): number;
