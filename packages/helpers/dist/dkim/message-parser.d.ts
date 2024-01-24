/// <reference types="node" />
/// <reference types="node" />
import { ParsedHeaders } from './index';
import { Writable, WritableOptions } from 'stream';
/**
 * Class for separating header from body
 *
 * @class
 * @extends Writable
 */
export declare class MessageParser extends Writable {
    byteLength: number;
    headers: ParsedHeaders | boolean;
    private state;
    private stateBytes;
    private headerChunks;
    private lastByte;
    constructor(options?: WritableOptions);
    nextChunk(...args: any): Promise<void>;
    finalChunk(...args: any): Promise<void>;
    messageHeaders(headers: ParsedHeaders): Promise<void>;
    processChunk(chunk: Buffer): Promise<void>;
    ensureLinebreaks(input: Buffer): Generator<Buffer, void, unknown>;
    writeAsync(chunk: any, encoding: BufferEncoding): Promise<void>;
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
    finish(): Promise<void>;
    _final(callback: (error?: Error | null) => void): void;
}
