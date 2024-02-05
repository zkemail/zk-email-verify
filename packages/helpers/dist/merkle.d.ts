export declare function buildMerkleTree(leaves: string[]): string[];
export declare function getMerkleProof(merkleTree: string[], leaf: string): Promise<{
    leaf: string;
    pathElements: (string | number)[];
    pathIndices: number[];
    root: string;
}>;
