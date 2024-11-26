import { BTCTransactionBuilder } from './builder/BTCTransactionBuilder';
import { RuneTransactionBuilder } from './builder/RuneTransactionBuilder';
import { StampTransactionBuilder } from './builder/StampTransactionBuilder';
import { XCPTransactionBuilder } from './builder/XCPTransactionBuilder';
import { NetworkConfig } from './types';
export * from './types';
export * from './constants';
export * from './utils/validation';
export declare class TransactionBuilder {
    private btcBuilder;
    private runeBuilder;
    private stampBuilder;
    private xcpBuilder;
    constructor(config: NetworkConfig);
    getBTCBuilder(): BTCTransactionBuilder;
    getRuneBuilder(): RuneTransactionBuilder;
    getStampBuilder(): StampTransactionBuilder;
    getXCPBuilder(): XCPTransactionBuilder;
}
export default TransactionBuilder;
