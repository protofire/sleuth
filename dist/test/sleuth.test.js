"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sleuth_1 = require("../sleuth");
const providers_1 = require("@ethersproject/providers");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
describe('testing sleuthing', () => {
    let provider;
    beforeAll(() => {
        provider = new providers_1.JsonRpcProvider('http://127.0.0.1:8599');
    });
    test('should return the block number via compilation', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let solidity = yield fs.readFile(path.join(__dirname, '../../src/examples/BlockNumber.sol'), 'utf8');
        let res = yield sleuth.fetch(sleuth_1.Sleuth.querySol(solidity));
        expect(res.toNumber()).toBe(1);
    }));
    test('should return the block number via precompile', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let solidity = yield fs.readFile(path.join(__dirname, '../../out/BlockNumber.sol/BlockNumber.json'), 'utf8');
        console.log({ solidity });
        let res = yield sleuth.fetch(sleuth_1.Sleuth.querySol(solidity));
        console.log("res", res);
        expect(res.toNumber()).toBe(1);
    }));
    test('should handle args', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let solidity = yield fs.readFile(path.join(__dirname, '../../out/Birthday.sol/Birthday.json'), 'utf8');
        console.log({ solidity });
        let res = yield sleuth.fetch(sleuth_1.Sleuth.querySol(solidity), [5]);
        console.log("res", res);
        expect(res.toNumber()).toBe(6);
    }));
    test('should return the pair', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let solidity = yield fs.readFile(path.join(__dirname, '../../src/examples/Pair.sol'), 'utf8');
        let res = yield sleuth.fetch(sleuth_1.Sleuth.querySol(solidity));
        console.log(res);
        expect(res[0].toNumber()).toBe(55);
        expect(res[1]).toEqual("hello");
    }));
    test('should fail invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        expect(() => sleuth.query("INSERT INTO users;")).toThrow();
    }));
    test('should parse sleuth', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let q = sleuth.query("SELECT block.number FROM block;");
        let number = yield sleuth.fetch(q);
        // TODO: Check why named return types aren't working
        expect(number.toNumber()).toEqual(1);
    }));
    test('should parse sleuth too', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let q = sleuth.query("SELECT block.number, \"dog\", 22 FROM block;");
        let [number, animal, age] = yield sleuth.fetch(q);
        expect(number.toNumber()).toEqual(1);
        expect(animal).toEqual("dog");
        expect(age.toNumber()).toEqual(22);
    }));
    test('including a call', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        sleuth.addSource("comet", "0xc3d688B66703497DAA19211EEdff47f25384cdc3", ["function totalSupply() returns (uint256)"]);
        let q = sleuth.query("SELECT comet.totalSupply FROM comet;");
        let [totalSupply] = yield sleuth.fetch(q);
        // TODO: Check why named return types aren't working
        expect(totalSupply.toNumber()).toEqual(160);
    }));
    test('fetchSql query', () => __awaiter(void 0, void 0, void 0, function* () {
        let sleuth = new sleuth_1.Sleuth(provider);
        let [totalSupply] = yield sleuth.fetchSql(`
      REGISTER CONTRACT comet AT 0xc3d688B66703497DAA19211EEdff47f25384cdc3 WITH INTERFACE ["function totalSupply() returns (uint256)"];
      SELECT comet.totalSupply FROM comet;
    `);
        expect(totalSupply.toNumber()).toEqual(160);
    }));
});
