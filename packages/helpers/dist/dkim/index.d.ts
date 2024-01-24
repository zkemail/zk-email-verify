/// <reference types="node" />
import { getSigningHeaderLines, parseDkimHeaders, parseHeaders } from "./tools";
export declare const dkimVerify: (input: Buffer, options?: any) => Promise<{
    headerFrom: string[];
    envelopeFrom: string | boolean;
    results: {
        [key: string]: any;
    }[];
}>;
export type DKIMVerificationResult = {
    signature: bigint;
    message: Buffer;
    body: Buffer;
    bodyHash: string;
    publicKey: bigint;
};
export declare function verifyDKIMSignature(email: Buffer): Promise<DKIMVerificationResult>;
export type SignatureType = 'DKIM' | 'ARC' | 'AS';
export type ParsedHeaders = ReturnType<typeof parseHeaders>;
export type Parsed = ParsedHeaders['parsed'][0];
export type ParseDkimHeaders = ReturnType<typeof parseDkimHeaders>;
export type SigningHeaderLines = ReturnType<typeof getSigningHeaderLines>;
export interface Options {
    signatureHeaderLine: string;
    signingDomain?: string;
    selector?: string;
    algorithm?: string;
    canonicalization: string;
    bodyHash?: string;
    signTime?: string | number | Date;
    signature?: string;
    instance: string | boolean;
    bodyHashedBytes?: string;
}
export * from "./dkim-verifier";
export * from "./message-parser";
export * from "./parse-dkim-headers";
export * from "./tools";
