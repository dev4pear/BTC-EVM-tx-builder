import { Network } from 'bitcoinjs-lib';
import { ERROR_MESSAGES } from '../constants';
import {
    TransactionInputs,
    InscriptionTransferInputs,
    StampTransactionInputs,
    XCPTransactionInputs,
    ValidationResult,
    StampData,
    XCPTransfer,
    RuneTransfer
} from '../types';

export const VALIDATION_REGEX = {
    BITCOIN_ADDRESS: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    PRIVATE_KEY_WIF: /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/,
    INSCRIPTION_ID: /^[a-fA-F0-9]{64}i[0-9]+$/,
    ASSET_ID: /^[A-Z0-9._]{4,12}$/,
    CONTENT_TYPE: /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+$/
};

export class ValidationUtils {
    static validateAddress(address: string, network: Network): ValidationResult {
        try {
            if (!address || !VALIDATION_REGEX.BITCOIN_ADDRESS.test(address)) {
                return {
                    isValid: false,
                    error: ERROR_MESSAGES.INVALID_ADDRESS
                };
            }
            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_ADDRESS
            };
        }
    }

    static validatePrivateKey(privateKey: string): ValidationResult {
        if (!privateKey || !VALIDATION_REGEX.PRIVATE_KEY_WIF.test(privateKey)) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_PRIVATE_KEY
            };
        }
        return { isValid: true };
    }

    static validateRuneTransfer(runeTransfer: RuneTransfer): void {
        if (!runeTransfer.runeId || typeof runeTransfer.runeId !== 'string') {
            throw new Error('Invalid rune id');
        }
        if (!runeTransfer.amount || runeTransfer.amount <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
        }
        if (!runeTransfer.destinationAddress || typeof runeTransfer.destinationAddress !== 'string') {
            throw new Error("invalid destination");
        }
    }
    static validateAmount(amount: number): ValidationResult {
        if (!amount || amount <= 0 || !Number.isFinite(amount)) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_AMOUNT
            };
        }
        return { isValid: true };
    }

    static validateStampData(stampData: StampData): ValidationResult {
        if (!stampData.content || !stampData.contentType) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_STAMP_DATA
            };
        }

        if (!VALIDATION_REGEX.CONTENT_TYPE.test(stampData.contentType)) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_CONTENT_TYPE
            };
        }

        return { isValid: true };
    }

    static validateXCPTransfer(xcpTransfer: XCPTransfer): ValidationResult {
        if (!xcpTransfer.asset || !VALIDATION_REGEX.ASSET_ID.test(xcpTransfer.asset)) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_ASSET_ID
            };
        }

        if (!this.validateAmount(xcpTransfer.amount).isValid) {
            return {
                isValid: false,
                error: ERROR_MESSAGES.INVALID_AMOUNT
            };
        }

        return { isValid: true };
    }
    
    static validateTransactionInputs(params: TransactionInputs): void {
        const addressResult = this.validateAddress(params.fromAddress, params.network);
        if (!addressResult.isValid) {
            throw new Error(addressResult.error);
        }

        const toAddressResult = this.validateAddress(params.toAddress, params.network);
        if (!toAddressResult.isValid) {
            throw new Error(toAddressResult.error);
        }

        const amountResult = this.validateAmount(params.amount);
        if (!amountResult.isValid) {
            throw new Error(amountResult.error);
        }

        const privateKeyResult = this.validatePrivateKey(params.privateKey);
        if (!privateKeyResult.isValid) {
            throw new Error(privateKeyResult.error);
        }
    }

    static validateInscriptionTransferInputs(params: InscriptionTransferInputs): void {
        const fromAddressResult = this.validateAddress(params.fromAddress, params.network);
        if (!fromAddressResult.isValid) {
            throw new Error(fromAddressResult.error);
        }

        const toAddressResult = this.validateAddress(params.destinationAddress, params.network);
        if (!toAddressResult.isValid) {
            throw new Error(toAddressResult.error);
        }

        if (!params.inscriptionId || !VALIDATION_REGEX.INSCRIPTION_ID.test(params.inscriptionId)) {
            throw new Error(ERROR_MESSAGES.INVALID_INSCRIPTION_DATA);
        }

        const privateKeyResult = this.validatePrivateKey(params.privateKey);
        if (!privateKeyResult.isValid) {
            throw new Error(privateKeyResult.error);
        }
    }
    
    static validateStampTransactionInputs(params: StampTransactionInputs): void {
        const addressResult = this.validateAddress(params.fromAddress, params.network);
        if (!addressResult.isValid) {
            throw new Error(addressResult.error);
        }

        const stampDataResult = this.validateStampData(params.stampData);
        if (!stampDataResult.isValid) {
            throw new Error(stampDataResult.error);
        }

        const privateKeyResult = this.validatePrivateKey(params.privateKey);
        if (!privateKeyResult.isValid) {
            throw new Error(privateKeyResult.error);
        }
    }

    static validateXCPTransactionInputs(params: XCPTransactionInputs): void {
        const addressResult = this.validateAddress(params.fromAddress, params.network);
        if (!addressResult.isValid) {
            throw new Error(addressResult.error);
        }

        const xcpTransferResult = this.validateXCPTransfer(params.xcpTransfer);
        if (!xcpTransferResult.isValid) {
            throw new Error(xcpTransferResult.error);
        }

        const toAddressResult = this.validateAddress(params.xcpTransfer.destinationAddress, params.network);
        if (!toAddressResult.isValid) {
            throw new Error(toAddressResult.error);
        }

        const privateKeyResult = this.validatePrivateKey(params.privateKey);
        if (!privateKeyResult.isValid) {
            throw new Error(privateKeyResult.error);
        }
    }
}
