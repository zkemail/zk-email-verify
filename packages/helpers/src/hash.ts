import { buildPoseidon } from 'circomlibjs';
import { bigIntToChunkedBytes } from './binary-format';

export async function poseidonLarge(input: bigint, numChunks: number, bitsPerChunk: number) {
  const poseidon = await buildPoseidon();
  const pubkeyChunked = bigIntToChunkedBytes(input, bitsPerChunk, numChunks);
  const hash = poseidon(pubkeyChunked);

  return poseidon.F.toObject(hash) as Promise<bigint>;
}

/**
 * Calculates Poseidon hash of an arbitrary number of inputs
 * Mimics the behavior of PoseidonModular circuit
 * @param inputs Array of bigints to be hashed
 * @returns Promise<bigint> The final hash
 */
export async function poseidonModular(inputs: bigint[]): Promise<bigint> {
    const poseidon = await buildPoseidon();
    const CHUNK_SIZE = 16;

    if (inputs.length === 0) {
        throw new Error("No inputs provided");
    }

    // Calculate number of chunks using Math.ceil for cleaner code
    const chunks = Math.ceil(inputs.length / CHUNK_SIZE);

    let out: bigint | null = null;

    // Process each chunk
    for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        // Use Math.min for cleaner end calculation
        const end = Math.min(start + CHUNK_SIZE, inputs.length);
        const chunk = inputs.slice(start, end);
        const chunkHash = poseidon.F.toObject(poseidon(chunk));

        if (i === 0) {
            out = chunkHash;
        } else {
            out = poseidon.F.toObject(poseidon([out as bigint, chunkHash]));
        }
    }

    return out as bigint;
}
