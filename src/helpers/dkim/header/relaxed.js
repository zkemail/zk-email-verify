'use strict';

const { formatSignatureHeaderLine, formatRelaxedLine } = require('../tools');

// generate headers for signing
const relaxedHeaders = (type, signingHeaderLines, options) => {
    let { signatureHeaderLine, signingDomain, selector, algorithm, canonicalization, bodyHash, signTime, signature, instance, bodyHashedBytes } = options || {};
    let chunks = [];

    for (let signedHeaderLine of signingHeaderLines.headers) {
        chunks.push(formatRelaxedLine(signedHeaderLine.line, '\r\n'));
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
            // ARC only
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

        signatureHeaderLine = formatSignatureHeaderLine(
            type,
            Object.assign(
                {
                    // make sure that b= always has a value, otherwise folding would be different
                    b: signature || 'a'.repeat(73)
                },
                opts
            ),
            true
        );
    }

    chunks.push(
        Buffer.from(
            formatRelaxedLine(signatureHeaderLine)
                .toString('binary')
                // remove value from b= key
                .replace(/([;:\s]+b=)[^;]+/, '$1'),
            'binary'
        )
    );

    return { canonicalizedHeader: Buffer.concat(chunks), signatureHeaderLine, dkimHeaderOpts: opts };
};

module.exports = { relaxedHeaders };
