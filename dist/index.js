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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_json_1 = __importDefault(require("./rpc.json"));
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
// @ts-ignore
const command_line_args_1 = __importDefault(require("command-line-args"));
const fs = __importStar(require("fs"));
const clOptions = [
    { name: 'pollingInterval', alias: 'i', type: Number, defaultValue: 0 },
    { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
];
const main = async () => {
    const options = (0, command_line_args_1.default)(clOptions);
    console.log(`Config: { pollingInterval: ${options.pollingInterval}, blocks: ${options.blocks} }`);
    const rpcs = [];
    // Create clients for each RPC
    rpc_json_1.default.forEach((rpc) => {
        console.log(`${rpc.name}: ${rpc.rpcUrl}`);
        const client = (0, viem_1.createPublicClient)({
            chain: chains_1.mainnet,
            transport: (0, viem_1.http)(rpc.rpcUrl),
        });
        rpcs.push({ name: rpc.name, rpcUrl: rpc.rpcUrl, client });
    });
    // Subscribe to new blocks for each client
    const latencies = [];
    const initialBlock = await rpcs[0].client.getBlockNumber();
    console.log(`Initial block: ${initialBlock}`);
    for (const rpc of rpcs) {
        let currentBlock = Number(initialBlock);
        const unwatch = rpc.client.watchBlocks({
            pollingInterval: options.pollingInterval === 0 ? undefined : options.pollingInterval,
            blockTag: 'latest',
            onBlock: block => {
                if (currentBlock === Number(block.number)) {
                    return;
                }
                const now = Date.now();
                const latency = now - Number(block.timestamp) * 1000;
                console.log(`[${rpc.name}] Current block: ${block.number}, Latency: ${latency}ms`);
                latencies.push({ rpcName: rpc.name, blockNumber: Number(block.number), latency: latency });
                currentBlock = Number(block.number);
                if (currentBlock >= Number(initialBlock) + options.blocks) {
                    const filteredLatencies = latencies.filter(latency => latency.rpcName === rpc.name);
                    const min = Math.min(...filteredLatencies.map(l => l.latency));
                    const max = Math.max(...filteredLatencies.map(l => l.latency));
                    const avg = filteredLatencies.reduce((sum, l) => sum + l.latency, 0) / filteredLatencies.length;
                    console.log(`[${rpc.name}] Summary: { min: ${min}ms, max: ${max}ms, avg: ${avg}ms}`);
                    const table = filteredLatencies.map(l => ({
                        blockNumber: l.blockNumber,
                        latency: l.latency,
                    }));
                    console.table(table);
                    const fileName = rpc.name.toLowerCase().replace(/\s+/g, '-');
                    fs.writeFileSync(`./output/${fileName}.json`, JSON.stringify({
                        config: {
                            rpcName: rpc.name,
                            rpcUrl: rpc.rpcUrl,
                            pollingInterval: options.pollingInterval,
                            blocks: options.blocks,
                        },
                        summary: {
                            min,
                            max,
                            avg,
                        },
                        blocks: table,
                    }));
                    unwatch();
                }
            },
        });
    }
};
main();
