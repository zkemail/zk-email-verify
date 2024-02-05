export declare const loadURL = "https://twitter-verifier-zkeys.s3.amazonaws.com/751fae9012c8a36543f60a2d2ec528d088ed6df0/";
export declare function downloadFromFilename(filename: string, compressed?: boolean): Promise<void>;
export declare const downloadProofFiles: (filename: string, onFileDownloaded: () => void) => Promise<void>;
export declare const uncompressProofFiles: (filename: string) => Promise<void>;
export declare function generateProof(input: any, filename: string): Promise<{
    proof: any;
    publicSignals: any;
}>;
export declare function verifyProof(proof: any, publicSignals: any): Promise<any>;
export declare function buildInput(pubkey: string, msghash: string, sig: string): {
    r: string[];
    s: string[];
    msghash: bigint[];
    pubkey: string[][];
};
