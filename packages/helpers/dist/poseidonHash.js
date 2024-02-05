"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.poseidonK = exports.poseidon = exports.initializePoseidon = void 0;
// @ts-ignore
const circomlibjs_1 = require("circomlibjs");
let poseidonHasher;
async function initializePoseidon() {
    if (!poseidonHasher) {
        poseidonHasher = await (0, circomlibjs_1.buildPoseidon)();
    }
}
exports.initializePoseidon = initializePoseidon;
const poseidon = (arr) => poseidonHasher.F.toString(poseidonHasher(arr));
exports.poseidon = poseidon;
const poseidonK = (ar) => {
    let cur = [];
    for (const elt of ar) {
        cur.push(elt);
        if (cur.length === 16) {
            cur = [(0, exports.poseidon)(cur)];
        }
    }
    if (cur.length === 1)
        return `${cur[0]}`;
    while (cur.length < 16)
        cur.push(0);
    return (0, exports.poseidon)(cur);
};
exports.poseidonK = poseidonK;
