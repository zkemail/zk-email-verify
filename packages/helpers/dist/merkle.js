"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerkleProof = exports.buildMerkleTree = void 0;
const lodash_1 = __importDefault(require("lodash"));
const poseidonHash_1 = require("./poseidonHash");
const constants_1 = require("./constants");
function buildMerkleTree(leaves) {
    const SIZE = leaves.length;
    const res = lodash_1.default.times(2 * SIZE, () => "0");
    for (let i = 0; i < SIZE; ++i) {
        res[SIZE + i] = leaves[i];
    }
    for (let i = SIZE - 1; i > 0; --i) {
        res[i] = (0, poseidonHash_1.poseidon)([res[2 * i], res[2 * i + 1]]);
    }
    return res;
}
exports.buildMerkleTree = buildMerkleTree;
async function getMerkleProof(merkleTree, leaf) {
    const pathElements = [];
    const pathIndices = [];
    for (let idx = merkleTree.indexOf(leaf); idx > 1; idx = idx >> 1) {
        pathElements.push(merkleTree[idx ^ 1]);
        pathIndices.push(idx & 1);
    }
    while (pathElements.length < constants_1.CIRCOM_LEVELS) {
        pathElements.push(0);
        pathIndices.push(0);
    }
    const root = merkleTree[1];
    return {
        leaf,
        pathElements,
        pathIndices,
        root,
    };
}
exports.getMerkleProof = getMerkleProof;
