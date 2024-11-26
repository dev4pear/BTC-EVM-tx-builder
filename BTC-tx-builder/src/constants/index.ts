// Protocol identifiers
export const STAMP_PROTOCOL_ID = 'STAMP';
export const XCP_PROTOCOL_ID = 'COUNTERPARTY';
export const RUNE_PROTOCOL_ID = 'RUNE';

// Transaction constants
export const DUST_THRESHOLD = 546; // Minimum output value in satoshis
export const DEFAULT_VSIZE = 250; // Default virtual size for transaction estimation
export const INSCRIPTION_VSIZE = 500; // Estimated vsize for inscription transfers
export const OP_RETURN_MAX_SIZE = 80; // Maximum size of OP_RETURN data in bytes
export const DEFAULT_FEE_RATE = 5;
// Error messages
export const ERROR_MESSAGES = {
    INVALID_ADDRESS: 'Invalid Bitcoin address',
    INVALID_PRIVATE_KEY: 'Invalid private key',
    INVALID_AMOUNT: 'Invalid amount',
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    INVALID_FEE_RATE: 'Invalid fee rate',
    INVALID_STAMP_DATA: 'Invalid stamp data',
    INVALID_CONTENT_TYPE: 'Invalid content type',
    INVALID_ASSET_ID: 'Invalid asset ID',
    INVALID_XCP_DATA: 'Invalid XCP transfer data',
    RUNE_DATA_TOO_LARGE: 'Invalid Rune data',
    INVALID_INSCRIPTION_DATA: 'Invalid inscription data',
    INSCRIPTION_NOT_FOUND: 'Inscription not found',
    NETWORK_ERROR: 'Network error occurred',
    BROADCAST_FAILED: 'Transaction broadcast failed',
    VALIDATION_FAILED: 'Transaction validation failed',
    INSUFFICIENT_RUNE_BALANCE : 'insufficient rune balance',
    STAMP_DATA_TOO_LARGE: 'Stamp data too large for OP_RETURN',
    TRANSACTION_FAILED: 'Transaction failed',
    NO_UTXOS_AVAILABLE: 'No UTXOs available for spending'
};
// Network constants
export const API_ENDPOINTS = {
    MAINNET: {
        MEMPOOL: 'https://mempool.space/api',
        BLOCKSTREAM: 'https://blockstream.info/api'
    },
    TESTNET: {
        MEMPOOL: 'https://mempool.space/testnet/api',
        BLOCKSTREAM: 'https://blockstream.info/testnet/api'
    }
};

// Protocol-specific constants
export const STAMP_CONTENT_TYPES = {
    TEXT: 'text/plain',
    JSON: 'application/json',
    IMAGE: 'image/jpeg',
    SVG: 'image/svg+xml',
    HTML: 'text/html'
};

export const XCP_ASSET_NAMES = {
    XCP: 'XCP',
    PEPECASH: 'PEPECASH',
    FLDC: 'FLDC',
    RUSTBITS: 'RUSTBITS'
};

// Fee calculation constants
export const FEE_CALCULATION = {
    MIN_FEE_RATE: 1,
    MAX_FEE_RATE: 500,
    PRIORITY_FEE_MULTIPLIER: 1.5
};

// Transaction size constants
export const TX_SIZES = {
    INPUT_SIZE: 148,
    OUTPUT_SIZE: 34,
    OVERHEAD_SIZE: 10,
    OP_RETURN_OVERHEAD: 9,
    P2PKH_INPUT_SCRIPT: 107,
    P2WPKH_INPUT_WITNESS: 27,
    P2TR_INPUT_WITNESS: 16
};
