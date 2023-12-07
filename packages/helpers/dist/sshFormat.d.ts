export declare function getRawSignature(signature: string): {
    readonly rawSignature: Uint8Array;
    readonly namespace: Uint8Array;
    readonly hash_algorithm: Uint8Array;
    readonly pubKeyEncoded: Uint8Array;
    readonly pubKeyParts: Uint8Array[];
    readonly pubSSHKeyStr: string;
};
export declare function sshSignatureToPubKey(signature: string): string;
