"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sleuth = void 0;
const contracts_1 = require("@ethersproject/contracts");
const abi_1 = require("@ethersproject/abi");
const address_1 = require("@ethersproject/address");
const parser_1 = require("../parser/pkg/parser");
;
const defaultOpts = {
    network: 'mainnet',
    version: 1
};
const sleuthDeployer = (_a = process.env['SLEUTH_DEPLOYER']) !== null && _a !== void 0 ? _a : '0x84C3e20985d9E7aEc46F80d2EB52b731D8CC40F8';
function solcCompile(input) {
    let solc;
    try {
        solc = require('solc');
    }
    catch (e) {
        throw new Error(`solc.js yarn dependency not found. Please build with optional dependencies included`);
    }
    return JSON.parse(solc.compile(JSON.stringify(input)));
}
function hexify(v) {
    return v.startsWith('0x') ? v : `0x${v}`;
}
class Sleuth {
    constructor(provider, opts = {}) {
        var _a, _b, _c;
        this.provider = provider;
        this.network = (_a = opts.network) !== null && _a !== void 0 ? _a : defaultOpts.network;
        this.version = (_b = opts.version) !== null && _b !== void 0 ? _b : defaultOpts.version;
        this.sleuthAddr = (0, address_1.getContractAddress)({ from: (_c = opts.sleuthDeployer) !== null && _c !== void 0 ? _c : sleuthDeployer, nonce: this.version - 1 });
        this.sources = [];
        this.coder = new abi_1.AbiCoder();
    }
    query(q) {
        var _a, _b, _c, _d;
        let registrations = this.sources.map((source) => {
            let iface = JSON.stringify(source.iface.format(abi_1.FormatTypes.full));
            return `REGISTER CONTRACT ${source.name} AT ${source.address} WITH INTERFACE ${iface};`;
        }).join("\n");
        let fullQuery = `${registrations}${q}`;
        console.log("Full Query", fullQuery);
        let [tuple, yul] = (0, parser_1.parse)(fullQuery).split(';', 2);
        console.log("Tuple", tuple, "Yul", yul);
        const input = {
            language: 'Yul',
            sources: {
                'query.yul': {
                    content: yul
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };
        let result = solcCompile(input);
        console.log(result.contracts['query.yul']);
        if (result.errors && result.errors.length > 0) {
            throw new Error("Compilation Error: " + JSON.stringify(result.errors));
        }
        let bytecode = (_d = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.contracts['query.yul']) === null || _a === void 0 ? void 0 : _a.Query) === null || _b === void 0 ? void 0 : _b.evm) === null || _c === void 0 ? void 0 : _c.bytecode) === null || _d === void 0 ? void 0 : _d.object;
        if (!bytecode) {
            throw new Error(`Missing bytecode from compilation result: ${JSON.stringify(result)}`);
        }
        return {
            bytecode: bytecode,
            fn: abi_1.FunctionFragment.from({
                name: 'query',
                inputs: [],
                outputs: abi_1.ParamType.from(tuple).components,
                stateMutability: 'pure',
                type: 'function'
            })
        };
    }
    static querySol(q, opts = {}) {
        if (typeof (q) === 'string') {
            let r;
            try {
                // Try to parse as JSON, if that fails, then consider a query
                r = JSON.parse(q);
            }
            catch (e) {
                // Ignore
            }
            if (r) {
                return this.querySolOutput(r, opts);
            }
            else {
                // This must be a source file, try to compile
                return this.querySolSource(q, opts);
            }
        }
        else {
            // This was passed in as a pre-parsed contract. Or at least, it should have been.
            return this.querySolOutput(q, opts);
        }
    }
    static querySolOutput(c, opts = {}) {
        var _a, _b, _c, _d, _e;
        let queryFunctionName = (_a = opts.queryFunctionName) !== null && _a !== void 0 ? _a : 'query';
        let b = (_d = (_c = (_b = c.evm) === null || _b === void 0 ? void 0 : _b.bytecode) === null || _c === void 0 ? void 0 : _c.object) !== null && _d !== void 0 ? _d : (_e = c.bytecode) === null || _e === void 0 ? void 0 : _e.object;
        if (!b) {
            throw new Error(`Missing (evm.)bytecode.object in contract ${JSON.stringify(c, null, 4)}`);
        }
        let abi = c.abi;
        let queryAbi = abi.find(({ type, name }) => type === 'function' && name === queryFunctionName);
        if (!queryAbi) {
            throw new Error(`Query must include function \`${queryFunctionName}()\``);
        }
        return {
            bytecode: b,
            fn: queryAbi
        };
    }
    static querySolSource(q, opts = {}) {
        var _a;
        let fnName = (_a = opts.queryFunctionName) !== null && _a !== void 0 ? _a : 'query';
        let input = {
            language: 'Solidity',
            sources: {
                'query.sol': {
                    content: q
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };
        let result = solcCompile(input);
        if (result.errors && result.errors.length > 0) {
            throw new Error("Compilation Error: " + JSON.stringify(result.errors));
        }
        let contract = result.contracts['query.sol'];
        if (!contract) {
            throw new Error(`Missing query.sol compiled contract in ${JSON.stringify(Object.keys(result.contracts))}`);
        }
        let c = Object.values(contract)[0];
        if (!c) {
            throw new Error(`Query does not contain any contract definitions`);
        }
        else if (Object.keys(contract).length > 1) {
            console.warn(`Query contains multiple contracts, using ${Object.keys(contract)[0]}`);
        }
        return this.querySolOutput(c, opts);
    }
    addSource(name, address, iface) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(iface)) {
                iface = new abi_1.Interface(iface);
            }
            this.sources.push({ name, address, iface });
        });
    }
    fetch(q, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let sleuthCtx = new contracts_1.Contract(this.sleuthAddr, [
                'function query(bytes,bytes) public view returns (bytes)'
            ], this.provider);
            let iface = new abi_1.Interface([q.fn]);
            let argsCoded = iface.encodeFunctionData(q.fn.name, args !== null && args !== void 0 ? args : []);
            let queryResult = yield sleuthCtx.query(hexify(q.bytecode), argsCoded);
            console.log(q.fn);
            console.log(queryResult);
            let r = this.coder.decode((_a = q.fn.outputs) !== null && _a !== void 0 ? _a : [], queryResult);
            if (Array.isArray(r) && r.length === 1) {
                return r[0];
            }
            else {
                return r;
            }
        });
    }
    fetchSql(q) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.query(q);
            return this.fetch(query, []);
        });
    }
}
exports.Sleuth = Sleuth;
