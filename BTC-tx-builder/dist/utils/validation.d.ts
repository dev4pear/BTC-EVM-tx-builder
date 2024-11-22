export declare function isValidAddress(address: string, network: 'mainnet' | 'testnet'): boolean;
export declare function isValidAmount(amount: number): boolean;
export declare function isValidPrivateKey(privateKey: string): boolean;
export declare function isValidTxId(txid: string): boolean;
export declare function validateTransactionInputs(fromAddress: string, toAddress: string, amount: number, network: 'mainnet' | 'testnet'): void;
