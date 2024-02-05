/// <reference types="node" />
/// <reference types="node" />
import * as crypto from 'crypto';
/**
 * Class for calculating body hash of an email message body stream
 * using the "relaxed" canonicalization
 *
 * @class
 */
export declare class RelaxedHash {
    byteLength: number;
    bodyHashedBytes: number;
    private remainder;
    private bodyHash;
    private maxBodyLength;
    private maxSizeReached;
    private emptyLinesQueue;
    private fullBody;
    /**
     * @param {String} [algorithm] Hashing algo, either "sha1" or "sha256"
     * @param {Number} [maxBodyLength] Allowed body length count, the value from the l= parameter
     */
    constructor(algorithm: string, maxBodyLength: number);
    private updateBodyHash;
    private drainPendingEmptyLines;
    private pushBodyHash;
    fixLineBuffer(line: Buffer): Buffer;
    update(chunk: Buffer | null, final: boolean): void;
    digest(encoding: crypto.BinaryToTextEncoding): string;
}
