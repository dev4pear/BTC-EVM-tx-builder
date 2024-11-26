import { BTCTransactionBuilder } from './builder/BTCTransactionBuilder';
import { RuneTransactionBuilder } from './builder/RuneTransactionBuilder';
import { StampTransactionBuilder } from './builder/StampTransactionBuilder';
import { XCPTransactionBuilder } from './builder/XCPTransactionBuilder';
import { NetworkConfig } from './types';

export * from './types';
export * from './constants';
export * from './utils/validation';

export class TransactionBuilder {
    private btcBuilder: BTCTransactionBuilder;
    private runeBuilder: RuneTransactionBuilder;
    private stampBuilder: StampTransactionBuilder;
    private xcpBuilder: XCPTransactionBuilder;

    constructor(config: NetworkConfig) {
        this.btcBuilder = new BTCTransactionBuilder(config);
        this.runeBuilder = new RuneTransactionBuilder(config);
        this.stampBuilder = new StampTransactionBuilder(config);
        this.xcpBuilder = new XCPTransactionBuilder(config);
    }

    getBTCBuilder(): BTCTransactionBuilder {
        return this.btcBuilder;
    }

    getRuneBuilder(): RuneTransactionBuilder {
        return this.runeBuilder;
    }

    getStampBuilder(): StampTransactionBuilder {
        return this.stampBuilder;
    }

    getXCPBuilder(): XCPTransactionBuilder {
        return this.xcpBuilder;
    }
}

export default TransactionBuilder;
