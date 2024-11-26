"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBuilder = void 0;
const BTCTransactionBuilder_1 = require("./builder/BTCTransactionBuilder");
const RuneTransactionBuilder_1 = require("./builder/RuneTransactionBuilder");
const StampTransactionBuilder_1 = require("./builder/StampTransactionBuilder");
const XCPTransactionBuilder_1 = require("./builder/XCPTransactionBuilder");
__exportStar(require("./types"), exports);
__exportStar(require("./constants"), exports);
__exportStar(require("./utils/validation"), exports);
class TransactionBuilder {
    constructor(config) {
        this.btcBuilder = new BTCTransactionBuilder_1.BTCTransactionBuilder(config);
        this.runeBuilder = new RuneTransactionBuilder_1.RuneTransactionBuilder(config);
        this.stampBuilder = new StampTransactionBuilder_1.StampTransactionBuilder(config);
        this.xcpBuilder = new XCPTransactionBuilder_1.XCPTransactionBuilder(config);
    }
    getBTCBuilder() {
        return this.btcBuilder;
    }
    getRuneBuilder() {
        return this.runeBuilder;
    }
    getStampBuilder() {
        return this.stampBuilder;
    }
    getXCPBuilder() {
        return this.xcpBuilder;
    }
}
exports.TransactionBuilder = TransactionBuilder;
exports.default = TransactionBuilder;
