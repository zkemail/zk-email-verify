import _ from "lodash";
import { poseidon } from "./poseidonHash";
import { CIRCOM_LEVELS } from "./constants";

export function buildMerkleTree(leaves: string[]): string[] {
  const SIZE = leaves.length;
  const res = _.times(2 * SIZE, () => "0");
  for (let i = 0; i < SIZE; ++i) {
    res[SIZE + i] = leaves[i];
  }
  for (let i = SIZE - 1; i > 0; --i) {
    res[i] = poseidon([res[2 * i], res[2 * i + 1]]);
  }
  return res;
}

export async function getMerkleProof(merkleTree: string[], leaf: string) {
  const pathElements = [];
  const pathIndices = [];
  for (let idx = merkleTree.indexOf(leaf); idx > 1; idx = idx >> 1) {
    pathElements.push(merkleTree[idx ^ 1]);
    pathIndices.push(idx & 1);
  }
  while (pathElements.length < CIRCOM_LEVELS) {
    pathElements.push(0);
    pathIndices.push(0);
  }
  const root = merkleTree[1];
  return {
    leaf,
    pathElements,
    pathIndices,
    root,
  };
}
