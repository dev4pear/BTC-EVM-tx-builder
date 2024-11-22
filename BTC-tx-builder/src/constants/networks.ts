import * as bitcoin from 'bitcoinjs-lib';

export const NETWORKS = {
    mainnet: bitcoin.networks.bitcoin,
    testnet: bitcoin.networks.testnet
};

export const API_ENDPOINTS = {
    mainnet: 'https://mempool.space/api',
    testnet: 'https://mempool.space/testnet/api'
};

export const DEFAULT_SEQUENCE = 0xfffffffe; // RBF enabled
export const DEFAULT_LOCKTIME = 0;
export const DUST_AMOUNT = 546; // Minimum output value in satoshis
export const SAT_PER_BTC = 100_000_000;