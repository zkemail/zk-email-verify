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
exports.verifyDKIMSignature = exports.dkimVerify = void 0;
const node_forge_1 = require("node-forge");
const dkim_verifier_1 = require("./dkim-verifier");
const tools_1 = require("./tools");
const dkimVerify = async (input, options = {}) => {
    let dkimVerifier = new dkim_verifier_1.DkimVerifier(options);
    await (0, tools_1.writeToStream)(dkimVerifier, input);
    const result = {
        //headers: dkimVerifier.headers,
        headerFrom: dkimVerifier.headerFrom,
        envelopeFrom: dkimVerifier.envelopeFrom,
        results: dkimVerifier.results,
    };
    if (dkimVerifier.headers) {
        Object.defineProperty(result, "headers", {
            enumerable: false,
            configurable: false,
            writable: false,
            value: dkimVerifier.headers,
        });
    }
    return result;
};
exports.dkimVerify = dkimVerify;
async function verifyDKIMSignature(email) {
    const result = await (0, exports.dkimVerify)(email);
    if (!result.results[0]) {
        throw new Error(`No result found on dkim output ${result}`);
    }
    const { publicKey, signature, status, body, bodyHash } = result.results[0];
    if (!publicKey) {
        if (status.message) { // Has error
            throw new Error(result.results[0].status.message);
        }
        throw new Error(`No public key found on DKIM verification result`, result.results[0]);
    }
    const signatureBigInt = BigInt("0x" + Buffer.from(signature, "base64").toString("hex"));
    const pubKeyData = node_forge_1.pki.publicKeyFromPem(publicKey.toString());
    return {
        signature: signatureBigInt,
        message: status.signature_header,
        body,
        bodyHash,
        publicKey: BigInt(pubKeyData.n.toString()),
    };
}
exports.verifyDKIMSignature = verifyDKIMSignature;
// export dkim functions
__exportStar(require("./dkim-verifier"), exports);
__exportStar(require("./message-parser"), exports);
__exportStar(require("./parse-dkim-headers"), exports);
__exportStar(require("./tools"), exports);
