/// <reference types="node" />
export declare function shaHash(str: Uint8Array): Buffer;
export declare function partialSha(msg: Uint8Array, msgLen: number): Uint8Array;
export declare function sha256Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): [Uint8Array, number];
