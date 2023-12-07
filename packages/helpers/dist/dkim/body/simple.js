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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleHash = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Class for calculating body hash of an email message body stream
 * using the "simple" canonicalization
 *
 * @class
 */
class SimpleHash {
    /**
     * @param {String} [algorithm] Hashing algo, either "sha1" or "sha256"
     * @param {Number} [maxBodyLength] Allowed body length count, the value from the l= parameter
     */
    constructor(algorithm, maxBodyLength) {
        algorithm = algorithm?.split('-')?.pop() || 'sha256';
        this.bodyHash = crypto.createHash(algorithm);
        this.remainder = [];
        this.byteLength = 0;
        this.bodyHashedBytes = 0;
        this.maxBodyLength = maxBodyLength;
        this.lastNewline = false;
        this.fullBody = Buffer.alloc(0);
    }
    updateBodyHash(chunk) {
        // the following is needed for l= option
        if (typeof this.maxBodyLength === 'number' &&
            !isNaN(this.maxBodyLength) &&
            this.maxBodyLength >= 0 &&
            this.bodyHashedBytes + chunk.length > this.maxBodyLength) {
            if (this.bodyHashedBytes >= this.maxBodyLength) {
                // nothing to do here, skip entire chunk
                return;
            }
            // only use allowed size of bytes
            chunk = chunk.subarray(0, this.maxBodyLength - this.bodyHashedBytes);
        }
        this.bodyHashedBytes += chunk.length;
        this.bodyHash.update(chunk);
        this.fullBody = Buffer.concat([this.fullBody, chunk]);
        //process.stdout.write(chunk);
    }
    update(chunk) {
        if (this.remainder.length) {
            // see if we can release the last remainder
            for (let i = 0; i < chunk.length; i++) {
                let c = chunk[i];
                if (c !== 0x0a && c !== 0x0d) {
                    // found non-line terminator byte, can release previous chunk
                    for (let remainderChunk of this.remainder) {
                        this.updateBodyHash(remainderChunk);
                    }
                    this.remainder = [];
                }
            }
        }
        // find line terminators from the end of chunk
        let matchStart = false;
        for (let i = chunk.length - 1; i >= 0; i--) {
            let c = chunk[i];
            if (c === 0x0a || c === 0x0d) {
                // stop looking
                matchStart = i;
            }
            else {
                break;
            }
        }
        if (matchStart === 0) {
            // nothing but newlines in this chunk
            this.remainder.push(chunk);
            return;
        }
        else if (matchStart !== false) {
            this.remainder.push(chunk.subarray(matchStart));
            chunk = chunk.subarray(0, matchStart);
        }
        this.updateBodyHash(chunk);
        this.lastNewline = chunk[chunk.length - 1] === 0x0a;
    }
    digest(encoding) {
        if (!this.lastNewline || !this.bodyHashedBytes) {
            // emit empty line buffer to keep the stream flowing
            this.updateBodyHash(Buffer.from('\r\n'));
        }
        return this.bodyHash.digest(encoding);
    }
}
exports.SimpleHash = SimpleHash;
