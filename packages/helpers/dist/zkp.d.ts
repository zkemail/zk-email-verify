export declare function downloadFromFilename(loadURL: string, filename: string, compressed?: boolean): Promise<void>;
export declare const downloadProofFiles: (loadURL: string, filename: string, onFileDownloaded: () => void) => Promise<void>;
export declare const uncompressProofFiles: (loadURL: string, filename: string) => Promise<void>;
export declare function generateProof(loadURL: string, input: any, filename: string): Promise<{
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
