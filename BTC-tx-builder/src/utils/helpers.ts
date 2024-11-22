import * as bitcoin from 'bitcoinjs-lib';
import { NETWORKS, SAT_PER_BTC } from '../constants/networks';
import { UTXO } from '../types';

export function btcToSatoshis(btc: number): number {
    return Math.floor(btc * SAT_PER_BTC);
}

export function satoshisToBtc(satoshis: number): number {
    return satoshis / SAT_PER_BTC;
}

export function calculateTxSize(
    inputsCount: number,
    outputsCount: number,
    isSegwit: boolean
): number {
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

export function sortUtxos(utxos: UTXO[]): UTXO[] {
    return [...utxos].sort((a, b) => {
        // Sort by confirmation count (confirmed first)
        if (a.confirmations && b.confirmations) {
            return b.confirmations - a.confirmations;
        }
        // Sort by value if confirmation count is the same
        return b.value - a.value;
    });
}

export function createTransactionHex(
    inputs: { txid: string; vout: number }[],
    outputs: { address: string; value: number }[],
    network: 'mainnet' | 'testnet'
): string {
    const psbt = new bitcoin.Psbt({ network: NETWORKS[network] });

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

export function estimateFee(
    inputsCount: number,
    outputsCount: number,
    feeRate: number,
    isSegwit: boolean = true
): number {
    const txSize = calculateTxSize(inputsCount, outputsCount, isSegwit);
    return Math.ceil(txSize * feeRate);
}