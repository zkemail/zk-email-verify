"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDkimHeaders = exports.CustomError = exports.validateAlgorithm = exports.getAlignment = exports.formatDomain = exports.formatRelaxedLine = exports.formatAuthHeaderRow = exports.escapeCommentValue = exports.escapePropValue = exports.getPublicKey = exports.formatSignatureHeaderLine = exports.getSigningHeaderLines = exports.parseHeaders = exports.writeToStream = exports.defaultDKIMFieldNames = void 0;
// @ts-ignore
const libmime_1 = __importDefault(require("libmime"));
// @ts-ignore
const psl_1 = __importDefault(require("psl"));
const timers_1 = require("timers");
const node_forge_1 = require("node-forge");
const punycode_1 = __importDefault(require("punycode"));
const crypto_1 = __importDefault(require("crypto"));
const parse_dkim_headers_1 = __importDefault(require("./parse-dkim-headers"));
exports.parseDkimHeaders = parse_dkim_headers_1.default;
var isNode = false;
if (typeof process === "object") {
    if (typeof process.versions === "object") {
        if (typeof process.versions.node !== "undefined") {
            isNode = true;
        }
    }
}
const LOCAL = isNode;
let dns;
if (LOCAL) {
    dns = require("dns").promises;
}
exports.defaultDKIMFieldNames = "From:Sender:Reply-To:Subject:Date:Message-ID:To:" +
    "Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:" +
    "Content-Description:Resent-Date:Resent-From:Resent-Sender:" +
    "Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:" +
    "List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:" +
    "List-Owner:List-Archive:BIMI-Selector";
const keyOrderingDKIM = [
    "v",
    "a",
    "c",
    "d",
    "h",
    "i",
    "l",
    "q",
    "s",
    "t",
    "x",
    "z",
    "bh",
    "b",
];
const writeToStream = async (stream, input, chunkSize = 0) => {
    chunkSize = chunkSize || 64 * 1024;
    if (typeof input === "string") {
        input = Buffer.from(input);
    }
    return new Promise((resolve, reject) => {
        if (typeof input?.on === "function") {
            // pipe as stream
            console.log("pipe");
            input.pipe(stream);
            input.on("error", reject);
        }
        else {
            let pos = 0;
            let writeChunk = () => {
                if (pos >= input.length) {
                    return stream.end();
                }
                let chunk;
                if (pos + chunkSize >= input.length) {
                    chunk = input.subarray(pos);
                }
                else {
                    chunk = input.subarray(pos, pos + chunkSize);
                }
                pos += chunk.length;
                if (stream.write(chunk) === false) {
                    stream.once("drain", () => writeChunk());
                    return;
                }
                (0, timers_1.setImmediate)(writeChunk);
            };
            (0, timers_1.setImmediate)(writeChunk);
        }
        stream.on("end", resolve);
        stream.on("finish", resolve);
        stream.on("error", reject);
    });
};
exports.writeToStream = writeToStream;
const parseHeaders = (buf) => {
    let rows = buf
        .toString("binary")
        .replace(/[\r\n]+$/, "")
        .split(/\r?\n/)
        .map((row) => [row]);
    for (let i = rows.length - 1; i >= 0; i--) {
        if (i > 0 && /^\s/.test(rows[i][0])) {
            rows[i - 1] = rows[i - 1].concat(rows[i]);
            rows.splice(i, 1);
        }
    }
    const mappedRows = rows.map((row) => {
        const str = row.join("\r\n");
        let key = str.match(/^[^:]+/);
        let casedKey;
        if (key) {
            casedKey = key[0].trim();
            key = casedKey.toLowerCase();
        }
        return { key, casedKey, line: Buffer.from(str, "binary") };
    });
    return { parsed: mappedRows, original: buf };
};
exports.parseHeaders = parseHeaders;
const getSigningHeaderLines = (parsedHeaders, fieldNames, verify) => {
    fieldNames = (typeof fieldNames === "string" ? fieldNames : exports.defaultDKIMFieldNames)
        .split(":")
        .map((key) => key.trim().toLowerCase())
        .filter((key) => key);
    let signingList = [];
    if (verify) {
        let parsedList = [].concat(parsedHeaders);
        for (let fieldName of fieldNames) {
            for (let i = parsedList.length - 1; i >= 0; i--) {
                let header = parsedList[i];
                if (fieldName === header.key) {
                    signingList.push(header);
                    parsedList.splice(i, 1);
                    break;
                }
            }
        }
    }
    else {
        for (let i = parsedHeaders.length - 1; i >= 0; i--) {
            let header = parsedHeaders[i];
            if (fieldNames.includes(header.key ?? "")) {
                signingList.push(header);
            }
        }
    }
    return {
        keys: signingList.map((entry) => entry.casedKey).join(": "),
        headers: signingList,
    };
};
exports.getSigningHeaderLines = getSigningHeaderLines;
/**
 * Generates `DKIM-Signature: ...` header for selected values
 * @param {Object} values
 */
const formatSignatureHeaderLine = (type, values, folded) => {
    type = (type ?? "").toString().toUpperCase();
    let keyOrdering, headerKey;
    switch (type) {
        case "DKIM":
            headerKey = "DKIM-Signature";
            keyOrdering = keyOrderingDKIM;
            values = Object.assign({
                v: 1,
                t: Math.round(Date.now() / 1000),
                q: "dns/txt",
            }, values);
            break;
        case "ARC":
        case "AS":
            throw Error("err");
        default:
            throw new Error("Unknown Signature type");
    }
    const header = `${headerKey}: ` +
        Object.keys(values)
            .filter((key) => values[key] !== false &&
            typeof values[key] !== "undefined" &&
            values.key !== null &&
            keyOrdering.includes(key))
            .sort((a, b) => keyOrdering.indexOf(a) - keyOrdering.indexOf(b))
            .map((key) => {
            let val = values[key] ?? "";
            if (key === "b" && folded && val) {
                // fold signature value
                return `${key}=${val}`.replace(/.{75}/g, "$& ").trim();
            }
            if (["d", "s"].includes(key) && typeof val === "string") {
                try {
                    // convert to A-label if needed
                    val = punycode_1.default.toASCII(val);
                }
                catch (err) {
                    // ignore
                }
            }
            if (key === "i" && type === "DKIM" && typeof val === "string") {
                let atPos = val.indexOf("@");
                if (atPos >= 0) {
                    let domainPart = val.substr(atPos + 1);
                    try {
                        // convert to A-label if needed
                        domainPart = punycode_1.default.toASCII(domainPart);
                    }
                    catch (err) {
                        // ignore
                    }
                    val = val.substr(0, atPos + 1) + domainPart;
                }
            }
            return `${key}=${val}`;
        })
            .join("; ");
    if (folded) {
        return libmime_1.default.foldLines(header);
    }
    return header;
};
exports.formatSignatureHeaderLine = formatSignatureHeaderLine;
async function resolveDNSHTTP(name, type) {
    const resp = await fetch("https://dns.google/resolve?" +
        new URLSearchParams({
            name: name,
            type: type,
        }));
    const out = await resp.json();
    // For some DNS, the Answer response here contains more than 1 element in the array. The last element is the one containing the public key
    return [out.Answer[out.Answer.length - 1].data];
}
// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
function importRsaKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
    return window.crypto.subtle.importKey("spki", binaryDer, {
        name: "RSA-OAEP",
        hash: "SHA-256",
    }, true, ["encrypt"]);
}
const getPublicKey = async (type, name, minBitLength, resolver) => {
    minBitLength = minBitLength || 1024;
    if (LOCAL) {
        resolver = resolver || dns.resolve;
    }
    else {
        resolver = resolveDNSHTTP;
    }
    let list = await resolver(name, "TXT");
    let rr = list &&
        []
            .concat(list[0] || [])
            .join("")
            .replaceAll(/\s+/g, "")
            .replaceAll('"', "");
    if (rr) {
        // prefix value for parsing as there is no default value
        let entry = (0, parse_dkim_headers_1.default)("DNS: TXT;" + rr);
        const publicKeyValue = entry?.parsed?.p?.value;
        //'v=DKIM1;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwe34ubzrMzM9sT0XVkcc3UXd7W+EHCyHoqn70l2AxXox52lAZzH/UnKwAoO+5qsuP7T9QOifIJ9ddNH9lEQ95Y/GdHBsPLGdgSJIs95mXNxscD6MSyejpenMGL9TPQAcxfqY5xPViZ+1wA1qcryjdZKRqf1f4fpMY+x3b8k7H5Qyf/Smz0sv4xFsx1r+THNIz0rzk2LO3GvE0f1ybp6P+5eAelYU4mGeZQqsKw/eB20I3jHWEyGrXuvzB67nt6ddI+N2eD5K38wg/aSytOsb5O+bUSEe7P0zx9ebRRVknCD6uuqG3gSmQmttlD5OrMWSXzrPIXe8eTBaaPd+e/jfxwIDAQAB'
        // v=DKIM1;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwe34ubzrMzM9sT0XVkcc3UXd7W+EHCyHoqn70l2AxXox52lAZzH/UnKwAoO+5qsuP7T9QOifIJ9ddNH9lEQ95Y/GdHBsPLGdgSJIs95mXNxscD6MSyejpenMGL9TPQAcxfqY5xPViZ+1wA1qcr""yjdZKRqf1f4fpMY+x3b8k7H5Qyf/Smz0sv4xFsx1r+THNIz0rzk2LO3GvE0f1ybp6P+5eAelYU4mGeZQqsKw/eB20I3jHWEyGrXuvzB67nt6ddI+N2eD5K38wg/aSytOsb5O+bUSEe7P0zx9ebRRVknCD6uuqG3gSmQmttlD5OrMWSXzrPIXe8eTBaaPd+e/jfxwIDAQAB
        if (!publicKeyValue) {
            const err = new CustomError("Missing key value", "EINVALIDVAL", rr);
            throw err;
        }
        /*let validation = base64Schema.validate(publicKeyValue);
            if (validation.error) {
                throw new Error('Invalid base64 format for public key');
                err.code = 'EINVALIDVAL';
                err.rr = rr;
                err.details = validation.error;
                throw err;
            }*/
        if (type === "DKIM" &&
            entry?.parsed?.v &&
            (entry?.parsed?.v?.value || "").toString().toLowerCase().trim() !==
                "dkim1") {
            const err = new CustomError("Unknown key version", "EINVALIDVER", rr);
            throw err;
        }
        let paddingNeeded = publicKeyValue.length % 4 ? 4 - (publicKeyValue.length % 4) : 0;
        const publicKeyPem = Buffer.from(`-----BEGIN PUBLIC KEY-----\n${(publicKeyValue + "=".repeat(paddingNeeded)).replace(/.{64}/g, "$&\n")}\n-----END PUBLIC KEY-----`);
        let publicKeyObj;
        if (LOCAL) {
            publicKeyObj = crypto_1.default.createPublicKey({
                key: publicKeyPem,
                format: "pem",
            });
        }
        else {
            publicKeyObj = await importRsaKey(publicKeyPem.toString());
        }
        let keyType;
        if (LOCAL) {
            keyType = publicKeyObj.asymmetricKeyType;
        }
        else {
            keyType = publicKeyObj.algorithm.name
                .split("-")[0]
                .toLowerCase();
        }
        if (!["rsa", "ed25519"].includes(keyType ?? "") ||
            (entry?.parsed?.k && entry?.parsed?.k?.value?.toLowerCase() !== keyType)) {
            throw new CustomError("Unknown key type (${keyType})", "EINVALIDTYPE", rr);
        }
        let modulusLength;
        if (publicKeyObj.algorithm) {
            modulusLength = publicKeyObj.algorithm?.modulusLength;
        }
        else {
            // fall back to node-forge
            const pubKeyData = node_forge_1.pki.publicKeyFromPem(publicKeyPem.toString());
            // const pubKeyData = CryptoJS.parseKey(publicKeyPem.toString(), 'pem');
            modulusLength = pubKeyData.n.bitLength();
        }
        if (keyType === "rsa" && modulusLength < 1024) {
            throw new CustomError("RSA key too short", "ESHORTKEY", rr);
        }
        return {
            publicKey: publicKeyPem,
            rr,
            modulusLength,
        };
    }
    throw new CustomError("Missing key value", "EINVALIDVAL", rr);
};
exports.getPublicKey = getPublicKey;
const escapePropValue = (value) => {
    value = (value || "")
        .toString()
        .replace(/[\x00-\x1F]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!/[\s\x00-\x1F\x7F-\uFFFF()<>,;:\\"/[\]?=]/.test(value)) {
        // return token value
        return value;
    }
    // return quoted string with escaped quotes
    return `"${value.replace(/["\\]/g, (c) => `\\${c}`)}"`;
};
exports.escapePropValue = escapePropValue;
const escapeCommentValue = (value) => {
    value = (value || "")
        .toString()
        .replace(/[\x00-\x1F]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return `${value.replace(/[\\)]/g, (c) => `\\${c}`)}`;
};
exports.escapeCommentValue = escapeCommentValue;
const formatAuthHeaderRow = (method, status) => {
    status = status || {};
    let parts = [];
    parts.push(`${method}=${status.result || "none"}`);
    if (status.comment) {
        parts.push(`(${(0, exports.escapeCommentValue)(status.comment)})`);
    }
    for (let ptype of ["policy", "smtp", "body", "header"]) {
        if (!status[ptype] || typeof status[ptype] !== "object") {
            continue;
        }
        for (let prop of Object.keys(status[ptype])) {
            if (status[ptype][prop]) {
                parts.push(`${ptype}.${prop}=${(0, exports.escapePropValue)(status[ptype][prop])}`);
            }
        }
    }
    return parts.join(" ");
};
exports.formatAuthHeaderRow = formatAuthHeaderRow;
const formatRelaxedLine = (line, suffix) => {
    let result = line
        ?.toString("binary")
        // unfold
        .replace(/\r?\n/g, "")
        // key to lowercase, trim around :
        .replace(/^([^:]*):\s*/, (m, k) => k.toLowerCase().trim() + ":")
        // single WSP
        .replace(/\s+/g, " ")
        .trim() + (suffix ? suffix : "");
    return Buffer.from(result, "binary");
};
exports.formatRelaxedLine = formatRelaxedLine;
const formatDomain = (domain) => {
    domain = domain.toLowerCase().trim();
    try {
        domain = punycode_1.default.toASCII(domain).toLowerCase().trim();
    }
    catch (err) {
        // ignore punycode errors
    }
    return domain;
};
exports.formatDomain = formatDomain;
const getAlignment = (fromDomain, domainList, strict = false) => {
    domainList = [].concat(domainList || []);
    if (strict) {
        fromDomain = (0, exports.formatDomain)(fromDomain);
        for (let domain of domainList) {
            domain = (0, exports.formatDomain)(psl_1.default.get(domain) || domain);
            if ((0, exports.formatDomain)(domain) === fromDomain) {
                return domain;
            }
        }
    }
    // match org domains
    fromDomain = (0, exports.formatDomain)(psl_1.default.get(fromDomain) || fromDomain);
    for (let domain of domainList) {
        domain = (0, exports.formatDomain)(psl_1.default.get(domain) || domain);
        if (domain === fromDomain) {
            return domain;
        }
    }
    return false;
};
exports.getAlignment = getAlignment;
const validateAlgorithm = (algorithm, strict) => {
    try {
        if (!algorithm || !/^[^-]+-[^-]+$/.test(algorithm)) {
            throw new Error("Invalid algorithm format");
        }
        let [signAlgo, hashAlgo] = algorithm.toLowerCase().split("-");
        if (!["rsa", "ed25519"].includes(signAlgo)) {
            throw new Error("Unknown signing algorithm: " + signAlgo);
        }
        if (!["sha256"].concat(!strict ? "sha1" : []).includes(hashAlgo)) {
            throw new Error("Unknown hashing algorithm: " + hashAlgo);
        }
    }
    catch (err) {
        if (err !== null && typeof err === "object" && Object.hasOwn(err, "code")) {
            err.code = "EINVALIDALGO";
        }
        throw err;
    }
};
exports.validateAlgorithm = validateAlgorithm;
class CustomError extends Error {
    constructor(message, code, rr) {
        super(message);
        this.code = code;
        this.rr = rr ?? "";
    }
}
exports.CustomError = CustomError;
