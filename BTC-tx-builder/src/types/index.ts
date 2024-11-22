export interface UTXO {
    txid: string;
    vout: number;
    value: number;
    address: string;
    scriptPubKey: string;
    confirmations?: number;
    witnessUtxo?: {
        script: Buffer;
        value: number;
    };
}

export interface TransactionInput {
    hash: string;
    index: number;
    witnessUtxo: {
        script: Buffer;
        value: number;
    };
}

export interface TransactionOutput {
    address: string;
    value: number;
}

export interface TransactionResult {
    txHex: string;
    txId: string;
    fee: number;
}

export interface InscriptionTransfer {
    inscriptionId: string;
    inscriptionUtxo: UTXO;
    destinationAddress: string;
}

export interface NetworkConfig {
    network: 'mainnet' | 'testnet';
    addressType: 'p2wpkh' | 'p2tr';
    apiBaseUrl: string;
}

export interface FeeRates {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    minimumFee: number;
}

export interface KeyPairInfo {
    privateKey: string;
    publicKey: string;
    wif: string;
    address: string;
}

export interface SignedTransaction {
    txHex: string;
    txId: string;
}