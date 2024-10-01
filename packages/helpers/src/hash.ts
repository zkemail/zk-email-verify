import { buildPoseidon } from 'circomlibjs';
import { bigIntToChunkedBytes } from './binary-format';

export async function poseidonLarge(input: bigint, numChunks: number, bitsPerChunk: number) {
  const poseidon = await buildPoseidon();
  const pubkeyChunked = bigIntToChunkedBytes(input, bitsPerChunk, numChunks);
  const hash = poseidon(pubkeyChunked);

  return poseidon.F.toObject(hash) as Promise<bigint>;
}
