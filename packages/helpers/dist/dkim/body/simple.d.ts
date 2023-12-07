/// <reference types="node" />
/// <reference types="node" />
import * as crypto from 'crypto';
/**
 * Class for calculating body hash of an email message body stream
 * using the "simple" canonicalization
 *
 * @class
 */
export declare class SimpleHash {
    byteLength: number;
    bodyHashedBytes: number;
    private remainder;
    private bodyHash;
    private maxBodyLength;
    private fullBody;
    private lastNewline;
    /**
     * @param {String} [algorithm] Hashing algo, either "sha1" or "sha256"
     * @param {Number} [maxBodyLength] Allowed body length count, the value from the l= parameter
     */
    constructor(algorithm: string, maxBodyLength: number);
    private updateBodyHash;
    update(chunk: Buffer): void;
    digest(encoding: crypto.BinaryToTextEncoding): string;
}
