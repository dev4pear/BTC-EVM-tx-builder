import * as bitcoin from 'bitcoinjs-lib';
import { NETWORKS } from '../constants/networks';

export function isValidAddress(address: string, network: 'mainnet' | 'testnet'): boolean {
    try {
        bitcoin.address.toOutputScript(address, NETWORKS[network]);
        return true;
    } catch (error) {
        return false;
    }
}

export function isValidAmount(amount: number): boolean {
    return Number.isInteger(amount) && amount > 0;
}

export function isValidPrivateKey(privateKey: string): boolean {
    try {
        return privateKey.length === 64 || (privateKey.length === 52 && privateKey.startsWith('K'));
    } catch (error) {
        return false;
    }
}

export function isValidTxId(txid: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(txid);
}

export function validateTransactionInputs(
    fromAddress: string,
    toAddress: string,
    amount: number,
    network: 'mainnet' | 'testnet'
): void {
    if (!isValidAddress(fromAddress, network)) {
        throw new Error('Invalid sender address');
    }
    if (!isValidAddress(toAddress, network)) {
        throw new Error('Invalid recipient address');
    }
    if (!isValidAmount(amount)) {
        throw new Error('Invalid amount');
    }
}