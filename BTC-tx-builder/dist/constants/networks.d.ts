import * as bitcoin from 'bitcoinjs-lib';
export declare const NETWORKS: {
    mainnet: bitcoin.networks.Network;
    testnet: bitcoin.networks.Network;
};
export declare const API_ENDPOINTS: {
    mainnet: string;
    testnet: string;
};
export declare const DEFAULT_SEQUENCE = 4294967294;
export declare const DEFAULT_LOCKTIME = 0;
export declare const DUST_AMOUNT = 546;
export declare const SAT_PER_BTC = 100000000;
