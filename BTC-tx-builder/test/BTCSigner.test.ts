import { BTCSigner } from '../src/BTCSigner';

// Create a signer instance for mainnet
const signer = new BTCSigner('mainnet');

// Create a new key pair
const newKeys = signer.createNewKeyPair();
console.log('New key pair:', newKeys);

// Get address from public key
const publicKey = Buffer.from(newKeys.publicKey, 'hex');
const address = signer.getAddress(publicKey, 'p2wpkh');
console.log('Address:', address);

// Sign a message
const message = 'Hello, Bitcoin!';
const signature = signer.signMessage(message, newKeys.wif);
console.log('Signature:', signature);

// Verify the signature
const isValid = signer.verifySignature(message, signature, newKeys.publicKey);
console.log('Signature valid:', isValid);
