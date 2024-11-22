import * as bitcoin from 'bitcoinjs-lib';
import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory, ECPairInterface } from 'ecpair';
import { Network } from 'bitcoinjs-lib';

// Initialize the required libraries
initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export class BTCSigner {
    private network: Network;

    constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
        this.network = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    }

    /**
     * Create a key pair from private key (WIF format)
     */
    createKeyPairFromWIF(wif: string): ECPairInterface {
        try {
            return ECPair.fromWIF(wif, this.network);
        } catch (error) {
            throw new Error(`Invalid private key: ${(error as Error).message}`);
        }
    }

    /**
     * Create a new key pair
     */
    createNewKeyPair(): {
        privateKey: string;
        publicKey: string;
        wif: string;
    } {
        try {
            const keyPair = ECPair.makeRandom({ network: this.network });
            return {
                privateKey: keyPair.privateKey!.toString('hex'),
                publicKey: keyPair.publicKey.toString('hex'),
                wif: keyPair.toWIF()
            };
        } catch (error) {
            throw new Error(`Failed to create key pair: ${(error as Error).message}`);
        }
    }

    /**
     * Get address from public key
     */
    getAddress(publicKey: Buffer, type: 'p2wpkh' | 'p2tr' = 'p2wpkh'): string {
        try {
            if (type === 'p2wpkh') {
                const { address } = bitcoin.payments.p2wpkh({
                    pubkey: publicKey,
                    network: this.network
                });
                if (!address) throw new Error('Failed to generate P2WPKH address');
                return address;
            } else {
                const { address } = bitcoin.payments.p2tr({
                    internalPubkey: publicKey.slice(1, 33), // Remove the first byte and get 32 bytes
                    network: this.network
                });
                if (!address) throw new Error('Failed to generate P2TR address');
                return address;
            }
        } catch (error) {
            throw new Error(`Failed to generate address: ${(error as Error).message}`);
        }
    }

    /**
     * Sign message
     */
    signMessage(message: string, privateKey: string): string {
        try {
            const keyPair = this.createKeyPairFromWIF(privateKey);
            const messageHash = bitcoin.crypto.sha256(Buffer.from(message));
            const signature = keyPair.sign(messageHash);
            return signature.toString('hex');
        } catch (error) {
            throw new Error(`Failed to sign message: ${(error as Error).message}`);
        }
    }

    /**
     * Verify message signature
     */
    verifySignature(
        message: string,
        signature: string,
        publicKey: string
    ): boolean {
        try {
            const messageHash = bitcoin.crypto.sha256(Buffer.from(message));
            const signatureBuffer = Buffer.from(signature, 'hex');
            const publicKeyBuffer = Buffer.from(publicKey, 'hex');

            return ecc.verify(
                messageHash,
                publicKeyBuffer,
                signatureBuffer
            );
        } catch (error) {
            throw new Error(`Failed to verify signature: ${(error as Error).message}`);
        }
    }

    /**
     * Sign PSBT input
     */
    signPsbtInput(
        psbt: bitcoin.Psbt,
        inputIndex: number,
        keyPair: ECPairInterface
    ): void {
        try {
            psbt.signInput(inputIndex, keyPair);
        } catch (error) {
            throw new Error(`Failed to sign PSBT input: ${(error as Error).message}`);
        }
    }

    /**
     * Sign raw transaction
     */
    signRawTransaction(
        txHex: string,
        privateKey: string,
        inputIndex: number = 0
    ): string {
        try {
            const tx = bitcoin.Transaction.fromHex(txHex);
            const keyPair = this.createKeyPairFromWIF(privateKey);

            const psbt = new bitcoin.Psbt({ network: this.network });
            psbt.setVersion(tx.version);

            // Add inputs and outputs from the raw transaction
            tx.ins.forEach((input, index) => {
                psbt.addInput({
                    hash: input.hash.toString('hex'),
                    index: input.index,
                    sequence: input.sequence,
                });
            });

            tx.outs.forEach((output) => {
                psbt.addOutput({
                    script: output.script,
                    value: output.value,
                });
            });

            // Sign the specified input
            this.signPsbtInput(psbt, inputIndex, keyPair);
            psbt.finalizeAllInputs();

            return psbt.extractTransaction().toHex();
        } catch (error) {
            throw new Error(`Failed to sign raw transaction: ${(error as Error).message}`);
        }
    }

    /**
     * Derive child keys (BIP32)
     */
    deriveChildKeys(
        seed: Buffer,
        path: string
    ): {
        privateKey: string;
        publicKey: string;
        wif: string;
        address: string;
    } {
        try {
            const root = bitcoin.bip32.fromSeed(seed, this.network);
            const child = root.derivePath(path);
            const keyPair = ECPair.fromPrivateKey(child.privateKey!, { network: this.network });

            return {
                privateKey: child.privateKey!.toString('hex'),
                publicKey: child.publicKey.toString('hex'),
                wif: keyPair.toWIF(),
                address: this.getAddress(child.publicKey)
            };
        } catch (error) {
            throw new Error(`Failed to derive child keys: ${(error as Error).message}`);
        }
    }
}