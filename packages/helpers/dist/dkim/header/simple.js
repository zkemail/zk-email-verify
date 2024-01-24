"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleHeaders = void 0;
const tools_1 = require("../tools");
const formatSimpleLine = (line, suffix) => Buffer.from(line.toString('binary') + (suffix ? suffix : ''), 'binary');
// generate headers for signing
const simpleHeaders = (type, signingHeaderLines, options) => {
    let { signatureHeaderLine, signingDomain, selector, algorithm, canonicalization, bodyHash, signTime, signature, instance, bodyHashedBytes } = options || {};
    let chunks = [];
    for (let signedHeaderLine of signingHeaderLines.headers) {
        chunks.push(formatSimpleLine(signedHeaderLine.line, '\r\n'));
    }
    let opts = false;
    if (!signatureHeaderLine) {
        opts = {
            a: algorithm,
            c: canonicalization,
            s: selector,
            d: signingDomain,
            h: signingHeaderLines.keys,
            bh: bodyHash
        };
        if (typeof bodyHashedBytes === 'number') {
            opts.l = bodyHashedBytes;
        }
        if (instance) {
            // ARC only (should never happen thoug as simple algo is not allowed)
            opts.i = instance;
        }
        if (signTime) {
            if (typeof signTime === 'string' || typeof signTime === 'number') {
                signTime = new Date(signTime);
            }
            if (Object.prototype.toString.call(signTime) === '[object Date]' && signTime.toString() !== 'Invalid Date') {
                // we need a unix timestamp value
                signTime = Math.round(signTime.getTime() / 1000);
                opts.t = signTime;
            }
        }
        signatureHeaderLine = (0, tools_1.formatSignatureHeaderLine)(type, Object.assign({
            // make sure that b= has a value, otherwise folding would be different
            b: signature || 'a'.repeat(73)
        }, opts), true);
    }
    chunks.push(Buffer.from(formatSimpleLine(signatureHeaderLine)
        .toString('binary')
        // remove value from b= key
        .replace(/([;:\s]+b=)[^;]+/, '$1'), 'binary'));
    return { canonicalizedHeader: Buffer.concat(chunks), signatureHeaderLine, dkimHeaderOpts: opts };
};
exports.simpleHeaders = simpleHeaders;
