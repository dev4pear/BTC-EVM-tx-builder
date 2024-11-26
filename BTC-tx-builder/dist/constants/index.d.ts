export declare const STAMP_PROTOCOL_ID = "STAMP";
export declare const XCP_PROTOCOL_ID = "COUNTERPARTY";
export declare const RUNE_PROTOCOL_ID = "RUNE";
export declare const DUST_THRESHOLD = 546;
export declare const DEFAULT_VSIZE = 250;
export declare const INSCRIPTION_VSIZE = 500;
export declare const OP_RETURN_MAX_SIZE = 80;
export declare const DEFAULT_FEE_RATE = 5;
export declare const ERROR_MESSAGES: {
    INVALID_ADDRESS: string;
    INVALID_PRIVATE_KEY: string;
    INVALID_AMOUNT: string;
    INSUFFICIENT_FUNDS: string;
    INVALID_FEE_RATE: string;
    INVALID_STAMP_DATA: string;
    INVALID_CONTENT_TYPE: string;
    INVALID_ASSET_ID: string;
    INVALID_XCP_DATA: string;
    RUNE_DATA_TOO_LARGE: string;
    INVALID_INSCRIPTION_DATA: string;
    INSCRIPTION_NOT_FOUND: string;
    NETWORK_ERROR: string;
    BROADCAST_FAILED: string;
    VALIDATION_FAILED: string;
    INSUFFICIENT_RUNE_BALANCE: string;
    STAMP_DATA_TOO_LARGE: string;
    TRANSACTION_FAILED: string;
    NO_UTXOS_AVAILABLE: string;
};
export declare const API_ENDPOINTS: {
    MAINNET: {
        MEMPOOL: string;
        BLOCKSTREAM: string;
    };
    TESTNET: {
        MEMPOOL: string;
        BLOCKSTREAM: string;
    };
};
export declare const STAMP_CONTENT_TYPES: {
    TEXT: string;
    JSON: string;
    IMAGE: string;
    SVG: string;
    HTML: string;
};
export declare const XCP_ASSET_NAMES: {
    XCP: string;
    PEPECASH: string;
    FLDC: string;
    RUSTBITS: string;
};
export declare const FEE_CALCULATION: {
    MIN_FEE_RATE: number;
    MAX_FEE_RATE: number;
    PRIORITY_FEE_MULTIPLIER: number;
};
export declare const TX_SIZES: {
    INPUT_SIZE: number;
    OUTPUT_SIZE: number;
    OVERHEAD_SIZE: number;
    OP_RETURN_OVERHEAD: number;
    P2PKH_INPUT_SCRIPT: number;
    P2WPKH_INPUT_WITNESS: number;
    P2TR_INPUT_WITNESS: number;
};
