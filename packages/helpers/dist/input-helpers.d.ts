/// <reference types="node" />
export declare function insert13Before10(a: Uint8Array): Uint8Array;
export declare function rawEmailToBuffer(email: string): Buffer;
export declare function findIndexInUint8Array(array: Uint8Array, selector: Uint8Array): number;
export declare function padUint8ArrayWithZeros(array: Uint8Array, length: number): Uint8Array;
export declare function generatePartialSHA({ body, bodyLength, selectorString, // String to split the body
maxRemainingBodyLength, }: {
    body: Uint8Array;
    bodyLength: number;
    selectorString?: string;
    maxRemainingBodyLength: number;
}): {
    precomputedSha: Uint8Array;
    bodyRemaining: Uint8Array;
    bodyRemainingLength: number;
};
type CircuitInput = {
    in_padded: string[];
    pubkey: string[];
    signature: string[];
    in_len_padded_bytes: string;
    precomputed_sha?: string[];
    in_body_padded?: string[];
    in_body_len_padded_bytes?: string;
    body_hash_idx?: string;
};
export declare function generateCircuitInputs(params: {
    body: Buffer;
    message: Buffer;
    bodyHash: string;
    rsaSignature: BigInt;
    rsaPublicKey: BigInt;
    shaPrecomputeSelector?: string;
    maxMessageLength: number;
    maxBodyLength: number;
    ignoreBodyHashCheck?: boolean;
}): CircuitInput;
export {};
