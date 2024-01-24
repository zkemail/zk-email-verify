/// <reference types="node" />
import { MessageParser } from "./message-parser";
import { ParsedHeaders } from "./index";
export declare class DkimVerifier extends MessageParser {
    envelopeFrom: string | boolean;
    headerFrom: string[];
    results: {
        [key: string]: any;
    }[];
    private options;
    private resolver;
    private minBitLength;
    private signatureHeaders;
    private bodyHashes;
    private arc;
    private seal;
    private sealBodyHashKey;
    constructor(options: Record<string, any>);
    messageHeaders(headers: ParsedHeaders): Promise<void>;
    nextChunk(chunk: Buffer): Promise<void>;
    finalChunk(): Promise<void>;
}
