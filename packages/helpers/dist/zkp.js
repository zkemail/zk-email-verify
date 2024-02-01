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
exports.buildInput = exports.verifyProof = exports.generateProof = exports.uncompressProofFiles = exports.downloadProofFiles = exports.downloadFromFilename = void 0;
const vkey_1 = require("./vkey");
const localforage_1 = __importDefault(require("localforage"));
const uncompress_1 = require("./uncompress");
// @ts-ignore
const snarkjs = __importStar(require("snarkjs"));
// export const loadURL = "https://twitter-verifier-zkeys.s3.amazonaws.com/751fae9012c8a36543f60a2d2ec528d088ed6df0/";
// export const loadURL = "http://localhost:3001/";
const compressed = true;
// const loadURL = "/zkemail-zkey-chunks/";
const zkeyExtension = ".gz";
const zkeyExtensionRegEx = new RegExp(`\\b${zkeyExtension}$\\b`, 'i'); // = /.gz$/i
const zkeySuffix = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
// We can use this function to ensure the type stored in localforage is correct.
async function storeArrayBuffer(keyname, buffer) {
    return await localforage_1.default.setItem(keyname, buffer);
}
async function downloadWithRetries(link, downloadAttempts) {
    for (let i = 1; i <= downloadAttempts; i++) {
        console.log(`download attempt ${i} for ${link}`);
        let response = await fetch(link, { method: "GET" });
        if (response.status == 200) {
            return response;
        }
    }
    throw new Error(`Error downloading ${link} after ${downloadAttempts} retries`);
}
// GET the compressed file from the remote server, then store it with localforage
// Note that it must be stored as an uncompressed ArrayBuffer
// and named such that filename===`${name}.zkey${a}` in order for it to be found by snarkjs.
async function downloadFromFilename(loadURL, filename, compressed = false) {
    const link = loadURL + filename;
    const zkeyResp = await downloadWithRetries(link, 3);
    const zkeyBuff = await zkeyResp.arrayBuffer();
    if (!compressed) {
        await storeArrayBuffer(filename, zkeyBuff);
    }
    else {
        // uncompress the data
        const zkeyUncompressed = await (0, uncompress_1.uncompressGz)(zkeyBuff);
        const rawFilename = filename.replace(zkeyExtensionRegEx, ""); // replace .gz with ""
        // store the uncompressed data
        console.log("storing file in localforage", rawFilename);
        await storeArrayBuffer(rawFilename, zkeyUncompressed);
        console.log("stored file in localforage", rawFilename);
        // await localforage.setItem(filename, zkeyBuff);
    }
    console.log(`Storage of ${filename} successful!`);
}
exports.downloadFromFilename = downloadFromFilename;
const downloadProofFiles = async function (loadURL, filename, onFileDownloaded) {
    const filePromises = [];
    for (const c of zkeySuffix) {
        const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
        const itemCompressed = await localforage_1.default.getItem(targzFilename);
        const item = await localforage_1.default.getItem(`${filename}.zkey${c}`);
        if (item) {
            console.log(`${filename}.zkey${c}${item ? "" : zkeyExtension} already found in localforage!`);
            onFileDownloaded();
            continue;
        }
        filePromises.push(
        // downloadFromFilename(targzFilename, true).then(
        downloadFromFilename(loadURL, targzFilename, compressed).then(() => onFileDownloaded()));
    }
    console.log(filePromises);
    await Promise.all(filePromises);
};
exports.downloadProofFiles = downloadProofFiles;
const uncompressProofFiles = async function (loadURL, filename) {
    const filePromises = [];
    for (const c of zkeySuffix) {
        const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
        const item = await localforage_1.default.getItem(`${filename}.zkey${c}`);
        const itemCompressed = await localforage_1.default.getItem(targzFilename);
        if (!itemCompressed) {
            console.error(`Error downloading file ${targzFilename}`);
        }
        else {
            console.log(`${filename}.zkey${c}${item ? "" : zkeyExtension} already found in localforage!`);
            continue;
        }
        filePromises.push(downloadFromFilename(loadURL, targzFilename));
    }
    console.log(filePromises);
    await Promise.all(filePromises);
};
exports.uncompressProofFiles = uncompressProofFiles;
async function generateProof(loadURL, input, filename) {
    // TODO: figure out how to generate this s.t. it passes build
    console.log("generating proof for input");
    console.log(input);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `${loadURL}${filename}.wasm`, `${filename}.zkey`);
    console.log(`Generated proof ${JSON.stringify(proof)}`);
    return {
        proof,
        publicSignals,
    };
}
exports.generateProof = generateProof;
async function verifyProof(proof, publicSignals) {
    console.log("PROOF", proof);
    console.log("PUBLIC SIGNALS", publicSignals);
    console.log("VK", vkey_1.vkey);
    const proofVerified = await snarkjs.groth16.verify(vkey_1.vkey, publicSignals, proof);
    console.log("proofV", proofVerified);
    return proofVerified;
}
exports.verifyProof = verifyProof;
function bigIntToArray(n, k, x) {
    let divisor = 1n;
    for (var idx = 0; idx < n; idx++) {
        divisor = divisor * 2n;
    }
    let ret = [];
    var x_temp = BigInt(x);
    for (var idx = 0; idx < k; idx++) {
        ret.push(x_temp % divisor);
        x_temp = x_temp / divisor;
    }
    return ret;
}
// taken from generation code in dizkus-circuits tests
function pubkeyToXYArrays(pk) {
    const XArr = bigIntToArray(64, 4, BigInt("0x" + pk.slice(4, 4 + 64))).map((el) => el.toString());
    const YArr = bigIntToArray(64, 4, BigInt("0x" + pk.slice(68, 68 + 64))).map((el) => el.toString());
    return [XArr, YArr];
}
// taken from generation code in dizkus-circuits tests
function sigToRSArrays(sig) {
    const rArr = bigIntToArray(64, 4, BigInt("0x" + sig.slice(2, 2 + 64))).map((el) => el.toString());
    const sArr = bigIntToArray(64, 4, BigInt("0x" + sig.slice(66, 66 + 64))).map((el) => el.toString());
    return [rArr, sArr];
}
function buildInput(pubkey, msghash, sig) {
    const [r, s] = sigToRSArrays(sig);
    return {
        r: r,
        s: s,
        msghash: bigIntToArray(64, 4, BigInt(msghash)),
        pubkey: pubkeyToXYArrays(pubkey),
    };
}
exports.buildInput = buildInput;
