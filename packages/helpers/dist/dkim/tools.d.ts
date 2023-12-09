/// <reference types="node" />
import parseDkimHeaders from "./parse-dkim-headers";
import { Parsed, SignatureType } from "./index";
import { DkimVerifier } from "./dkim-verifier";
export declare const defaultDKIMFieldNames: string;
export declare const writeToStream: (stream: DkimVerifier, input: Buffer & {
    pipe: (...args: any) => void;
    on: (...args: any) => void;
}, chunkSize?: number) => Promise<unknown>;
export declare const parseHeaders: (buf: Buffer) => {
    parsed: {
        key: string | null;
        casedKey: string | undefined;
        line: Buffer;
    }[];
    original: Buffer;
};
export declare const getSigningHeaderLines: (parsedHeaders: Parsed[], fieldNames: string | string[], verify: boolean) => {
    keys: string;
    headers: {
        key: string | null;
        casedKey: string | undefined;
        line: Buffer;
    }[];
};
/**
 * Generates `DKIM-Signature: ...` header for selected values
 * @param {Object} values
 */
export declare const formatSignatureHeaderLine: (type: SignatureType, values: Record<string, string | boolean>, folded: boolean) => string;
export declare const getPublicKey: (type: string, name: string, minBitLength: number, resolver: (name: string, type: string) => Promise<any>) => Promise<{
    publicKey: Buffer;
    rr: any;
    modulusLength: number;
}>;
export declare const escapePropValue: (value: string) => string;
export declare const escapeCommentValue: (value: string) => string;
export declare const formatAuthHeaderRow: (method: string, status: Record<string, any>) => string;
export declare const formatRelaxedLine: (line: Buffer | string, suffix?: string) => Buffer;
export declare const formatDomain: (domain: string) => string;
export declare const getAlignment: (fromDomain: string, domainList: string[], strict?: boolean) => string | false;
export declare const validateAlgorithm: (algorithm: string, strict: boolean) => void;
export declare class CustomError extends Error {
    code: string;
    rr: string;
    constructor(message: string, code: string, rr?: string);
}
export { parseDkimHeaders };
