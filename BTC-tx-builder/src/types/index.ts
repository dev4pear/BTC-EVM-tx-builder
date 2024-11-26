import { Network } from 'bitcoinjs-lib';

export interface NetworkConfig {
    network: 'mainnet' | 'testnet';
    apiBaseUrl: string;
}

export interface UTXO {
    txid: string;
    vout: number;
    value: number;
    scriptPubKey: string;
    isInscription?: boolean;
    inscriptionId?: string;
    isRune?: boolean;
    runeId?: string;
}

export interface RuneTransfer {
    runeId: string;
    amount: number;
    destinationAddress: string;
}

export interface TransactionResult {
    txHex: string;
    txId: string;
    fee: number;
    runeTransfer?: {
        runeId: string;
        amount: number;
        from: string;
        to: string;
    };
    stampData?: {
        content: string;
        contentType: string;
        timestamp: number;
    };
}

export interface StampData {
    content: string;
    contentType: string;
    additionalMetadata?: Record<string, any>;
}

export interface XCPTransfer {
    asset: string;
    amount: number;
    destinationAddress: string;
    memo?: string;
}

export interface InscriptionTransfer {
    inscriptionId: string;
    destinationAddress: string;
    inscriptionUtxo?: UTXO;
}

export interface RuneTransfer {
    runeId: string;
    amount: number;
    destinationAddress: string;
}

export interface TransactionInputs {
    fromAddress: string;
    toAddress: string;
    amount: number;
    privateKey: string;
    network: Network;
}

export interface InscriptionTransferInputs {
    fromAddress: string;
    destinationAddress: string;
    inscriptionId: string;
    privateKey: string;
    network: Network;
}

export interface StampTransactionInputs {
    fromAddress: string;
    stampData: StampData;
    privateKey: string;
    network: Network;
}

export interface XCPTransactionInputs {
    fromAddress: string;
    xcpTransfer: XCPTransfer;
    privateKey: string;
    network: Network;
}

export interface FeeRates {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}
