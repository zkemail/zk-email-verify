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
exports.DkimVerifier = void 0;
var isNode = false;
if (typeof process === 'object') {
    if (typeof process.versions === 'object') {
        if (typeof process.versions.node !== 'undefined') {
            isNode = true;
        }
    }
}
const LOCAL = isNode;
// @ts-ignore
const addressparser_1 = __importDefault(require("addressparser"));
const tools_1 = require("./tools");
const message_parser_1 = require("./message-parser");
const body_1 = require("./body");
const header_1 = require("./header");
const crypto = __importStar(require("crypto"));
class DkimVerifier extends message_parser_1.MessageParser {
    constructor(options) {
        super();
        this.sealBodyHashKey = '';
        this.options = options || {};
        this.resolver = this.options.resolver;
        this.minBitLength = this.options.minBitLength;
        this.results = [];
        this.signatureHeaders = [];
        this.bodyHashes = new Map();
        this.headerFrom = [];
        this.envelopeFrom = false;
        // ARC verification info
        this.arc = { chain: false };
        // should we also seal this message using ARC
        this.seal = this.options.seal;
        if (this.seal) {
            // calculate body hash for the seal
            let bodyCanon = "relaxed";
            let hashAlgo = "sha256";
            this.sealBodyHashKey = `${bodyCanon}:${hashAlgo}:`;
            this.bodyHashes.set(this.sealBodyHashKey, (0, body_1.dkimBody)(bodyCanon, hashAlgo, 0));
        }
    }
    async messageHeaders(headers) {
        this.headers = headers;
        this.signatureHeaders = headers.parsed
            .filter((h) => h.key === "dkim-signature")
            .map((h) => {
            const value = (0, tools_1.parseDkimHeaders)(h.line);
            value.type = "DKIM";
            return value;
        });
        let fromHeaders = headers?.parsed?.filter((h) => h.key === "from");
        for (const fromHeader of fromHeaders) {
            let fromHeaderString = fromHeader.line.toString();
            let splitterPos = fromHeaderString.indexOf(":");
            if (splitterPos >= 0) {
                fromHeaderString = fromHeaderString.substr(splitterPos + 1);
            }
            let from = (0, addressparser_1.default)(fromHeaderString.trim());
            for (let addr of from) {
                if (addr && addr.address) {
                    this.headerFrom.push(addr.address);
                }
            }
        }
        if (this.options.sender) {
            let returnPath = (0, addressparser_1.default)(this.options.sender);
            this.envelopeFrom = returnPath.length && returnPath[0].address ? returnPath[0].address : false;
        }
        else {
            let returnPathHeader = headers.parsed.filter((h) => h.key === "return-path").pop();
            if (returnPathHeader) {
                let returnPathHeaderString = returnPathHeader.line.toString();
                let splitterPos = returnPathHeaderString.indexOf(":");
                if (splitterPos >= 0) {
                    returnPathHeaderString = returnPathHeaderString.substr(splitterPos + 1);
                }
                let returnPath = (0, addressparser_1.default)(returnPathHeaderString.trim());
                this.envelopeFrom = returnPath.length && returnPath[0].address ? returnPath[0].address : false;
            }
        }
        for (let signatureHeader of this.signatureHeaders) {
            signatureHeader.algorithm = signatureHeader.parsed?.a?.value || "";
            signatureHeader.signAlgo = signatureHeader.algorithm.split("-").shift().toLowerCase().trim();
            signatureHeader.hashAlgo = signatureHeader.algorithm.split("-").pop().toLowerCase().trim();
            signatureHeader.canonicalization = signatureHeader.parsed?.c?.value || "";
            signatureHeader.headerCanon = signatureHeader.canonicalization.split("/").shift().toLowerCase().trim() || "simple";
            // if body canonicalization is not set, then defaults to 'simple'
            signatureHeader.bodyCanon = (signatureHeader.canonicalization.split("/")[1] || "simple").toLowerCase().trim();
            signatureHeader.signingDomain = signatureHeader.parsed?.d?.value || "";
            signatureHeader.selector = signatureHeader.parsed?.s?.value || "";
            signatureHeader.maxBodyLength = signatureHeader.parsed?.l?.value && !isNaN(signatureHeader.parsed?.l?.value) ? signatureHeader.parsed?.l?.value : "";
            const validSignAlgo = ["rsa", "ed25519"];
            const validHeaderAlgo = signatureHeader.type === "DKIM" ? ["sha256", "sha1"] : ["sha256"];
            const validHeaderCanon = signatureHeader.type !== "AS" ? ["relaxed", "simple"] : ["relaxed"];
            const validBodyCanon = signatureHeader.type !== "AS" ? ["relaxed", "simple"] : ["relaxed"];
            if (!validSignAlgo.includes(signatureHeader.signAlgo) ||
                !validHeaderAlgo.includes(signatureHeader.hashAlgo) ||
                !validHeaderCanon.includes(signatureHeader.headerCanon) ||
                !validBodyCanon.includes(signatureHeader.bodyCanon) ||
                !signatureHeader.signingDomain ||
                !signatureHeader.selector) {
                signatureHeader.skip = true;
                continue;
            }
            signatureHeader.bodyHashKey = [signatureHeader.bodyCanon, signatureHeader.hashAlgo, signatureHeader.maxBodyLength].join(":");
            if (!this.bodyHashes.has(signatureHeader.bodyHashKey)) {
                this.bodyHashes.set(signatureHeader.bodyHashKey, (0, body_1.dkimBody)(signatureHeader.bodyCanon, signatureHeader.hashAlgo, signatureHeader.maxBodyLength));
            }
        }
    }
    async nextChunk(chunk) {
        for (let bodyHash of this.bodyHashes.values()) {
            bodyHash.update(chunk);
        }
    }
    async finalChunk() {
        try {
            if (!this.headers || !this.bodyHashes.size) {
                return;
            }
            // convert bodyHashes from hash objects to base64 strings
            for (let [key, bodyHash] of this.bodyHashes.entries()) {
                this.bodyHashes.get(key).hash = bodyHash.digest("base64");
            }
            for (let signatureHeader of this.signatureHeaders) {
                if (signatureHeader.skip) {
                    // TODO: add failing header line?
                    continue;
                }
                let signingHeaderLines = (0, tools_1.getSigningHeaderLines)(this.headers.parsed, signatureHeader.parsed?.h?.value, true);
                let { canonicalizedHeader } = (0, header_1.generateCanonicalizedHeader)(signatureHeader.type, signingHeaderLines, {
                    signatureHeaderLine: signatureHeader.original,
                    canonicalization: signatureHeader.canonicalization,
                    instance: ["ARC", "AS"].includes(signatureHeader.type) ? signatureHeader.parsed?.i?.value : false,
                });
                let signingHeaders = {
                    keys: signingHeaderLines.keys,
                    headers: signingHeaderLines.headers.map((l) => l.line.toString()),
                };
                let publicKey, rr, modulusLength;
                let status = {
                    result: "neutral",
                    comment: false,
                    // ptype properties
                    header: {
                        // signing domain
                        i: signatureHeader.signingDomain ? `@${signatureHeader.signingDomain}` : false,
                        // dkim selector
                        s: signatureHeader.selector,
                        // algo
                        a: signatureHeader.parsed?.a?.value,
                        // signature value
                        b: signatureHeader.parsed?.b?.value ? `${signatureHeader.parsed?.b?.value.substr(0, 8)}` : false,
                    },
                };
                if (signatureHeader.type === "DKIM" && this.headerFrom?.length) {
                    status.aligned = this.headerFrom?.length ? (0, tools_1.getAlignment)(this.headerFrom[0] ?? ''.split("@")?.pop(), [signatureHeader.signingDomain]) : false;
                }
                let bodyHashObj = this.bodyHashes.get(signatureHeader.bodyHashKey);
                let bodyHash = bodyHashObj?.hash;
                if (signatureHeader.parsed?.bh?.value !== bodyHash) {
                    status.result = "neutral";
                    status.comment = `body hash did not verify`;
                }
                else {
                    try {
                        let res = await (0, tools_1.getPublicKey)(signatureHeader.type, `${signatureHeader.selector}._domainkey.${signatureHeader.signingDomain}`, this.minBitLength, this.resolver);
                        publicKey = res?.publicKey;
                        rr = res?.rr;
                        modulusLength = res?.modulusLength;
                        try {
                            let ver_result = false;
                            if (LOCAL) {
                                ver_result = crypto.verify(signatureHeader.signAlgo === "rsa" ? signatureHeader.algorithm : null, canonicalizedHeader, publicKey, Buffer.from(signatureHeader.parsed?.b?.value, "base64"));
                            }
                            else {
                                let ver = crypto.createVerify("RSA-SHA256");
                                ver.update(canonicalizedHeader);
                                ver_result = ver.verify({ key: publicKey.toString(), format: "pem" }, Buffer.from(signatureHeader.parsed?.b?.value, "base64"));
                            }
                            status.signature_header = canonicalizedHeader;
                            status.signature_value = signatureHeader.parsed?.b?.value;
                            status.result = ver_result ? "pass" : "fail";
                            if (status?.result === "fail") {
                                status.comment = "bad signature";
                            }
                        }
                        catch (err) {
                            status.comment = err.message;
                            status.result = "neutral";
                        }
                    }
                    catch (err) {
                        if (err.rr) {
                            rr = err.rr;
                        }
                        switch (err.code) {
                            case "ENOTFOUND":
                            case "ENODATA":
                                status.result = "neutral";
                                status.comment = `no key`;
                                break;
                            case "EINVALIDVER":
                                status.result = "neutral";
                                status.comment = `unknown key version`;
                                break;
                            case "EINVALIDTYPE":
                                status.result = "neutral";
                                status.comment = `unknown key type`;
                                break;
                            case "EINVALIDVAL":
                                status.result = "neutral";
                                status.comment = `invalid public key`;
                                break;
                            case "ESHORTKEY":
                                status.result = "policy";
                                if (!status.policy) {
                                    status.policy = {};
                                }
                                status.policy["dkim-rules"] = `weak-key`;
                                break;
                            default:
                                status.result = "temperror";
                                status.comment = `DNS failure: ${err.code || err.message}`;
                        }
                    }
                }
                signatureHeader.bodyHashedBytes = this.bodyHashes.get(signatureHeader.bodyHashKey)?.bodyHashedBytes;
                if (typeof signatureHeader.maxBodyLength === "number" && signatureHeader.maxBodyLength !== signatureHeader.bodyHashedBytes) {
                    status.result = "fail";
                    status.comment = `invalid body length ${signatureHeader.bodyHashedBytes}`;
                }
                let result = {
                    signingDomain: signatureHeader.signingDomain,
                    selector: signatureHeader.selector,
                    signature: signatureHeader.parsed?.b?.value,
                    algo: signatureHeader.parsed?.a?.value,
                    format: signatureHeader.parsed?.c?.value,
                    bodyHash,
                    bodyHashExpecting: signatureHeader.parsed?.bh?.value,
                    body: bodyHashObj?.fullBody,
                    signingHeaders,
                    status,
                };
                if (typeof signatureHeader.bodyHashedBytes === "number") {
                    result.canonBodyLength = signatureHeader.bodyHashedBytes;
                }
                if (typeof signatureHeader.maxBodyLength === "number") {
                    result.bodyLengthCount = signatureHeader.maxBodyLength;
                }
                if (publicKey) {
                    result.publicKey = publicKey.toString();
                }
                if (modulusLength) {
                    result.modulusLength = modulusLength;
                }
                if (rr) {
                    result.rr = rr;
                }
                if (typeof result.status.comment === "boolean") {
                    delete result.status.comment;
                }
                switch (signatureHeader.type) {
                    case "ARC":
                        throw Error("ARC not possible");
                        break;
                    case "DKIM":
                    default:
                        this.results.push(result);
                        break;
                }
            }
        }
        finally {
            if (!this.results.length) {
                this.results.push({
                    status: {
                        result: "none",
                        comment: "message not signed",
                    },
                });
            }
            this.results.forEach((result) => {
                result.info = (0, tools_1.formatAuthHeaderRow)("dkim", result.status);
            });
        }
        if (this.seal && this.bodyHashes.has(this.sealBodyHashKey) && typeof this.bodyHashes.get(this.sealBodyHashKey)?.hash === "string") {
            this.seal.bodyHash = this.bodyHashes.get(this.sealBodyHashKey).hash;
        }
    }
}
exports.DkimVerifier = DkimVerifier;
