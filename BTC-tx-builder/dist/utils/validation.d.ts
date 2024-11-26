import { Network } from 'bitcoinjs-lib';
import { TransactionInputs, InscriptionTransferInputs, StampTransactionInputs, XCPTransactionInputs, ValidationResult, StampData, XCPTransfer, RuneTransfer } from '../types';
export declare const VALIDATION_REGEX: {
    BITCOIN_ADDRESS: RegExp;
    PRIVATE_KEY_WIF: RegExp;
    INSCRIPTION_ID: RegExp;
    ASSET_ID: RegExp;
    CONTENT_TYPE: RegExp;
};
export declare class ValidationUtils {
    static validateAddress(address: string, network: Network): ValidationResult;
    static validatePrivateKey(privateKey: string): ValidationResult;
    static validateRuneTransfer(runeTransfer: RuneTransfer): void;
    static validateAmount(amount: number): ValidationResult;
    static validateStampData(stampData: StampData): ValidationResult;
    static validateXCPTransfer(xcpTransfer: XCPTransfer): ValidationResult;
    static validateTransactionInputs(params: TransactionInputs): void;
    static validateInscriptionTransferInputs(params: InscriptionTransferInputs): void;
    static validateStampTransactionInputs(params: StampTransactionInputs): void;
    static validateXCPTransactionInputs(params: XCPTransactionInputs): void;
}
