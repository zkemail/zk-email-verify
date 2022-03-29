import _ from "lodash";
import { poseidonK, poseidon } from "./poseidonHash";
import { CIRCOM_LEVELS } from "./constants";
import { toCircomBigIntBytes } from "./binaryFormat";

export async function buildMerkleTree(leaves: bigint[]) {
  leaves = _.sortBy(leaves);
  const SIZE = leaves.length;
  const res = _.times(2 * SIZE, () => "0");
  for (let i = 0; i < SIZE; ++i) {
    const bigIntBytes = toCircomBigIntBytes(leaves[i]);
    res[SIZE + i] = poseidonK(bigIntBytes);
  }
  for (let i = SIZE - 1; i > 0; --i) {
    res[i] = poseidon([res[2 * i], res[2 * i + 1]]);
  }
  return res;
}

export async function generateMerkleTreeInputs(
  groupModulusBigInts: bigint[],
  modulusBigInt: bigint
) {
  const tree = await buildMerkleTree(groupModulusBigInts);
  const leaf = poseidonK(toCircomBigIntBytes(modulusBigInt));
  const pathElements = [];
  const pathIndices = [];
  for (let idx = tree.indexOf(leaf); idx > 1; idx = idx >> 1) {
    pathElements.push(tree[idx ^ 1]);
    pathIndices.push(idx & 1);
  }
  while (pathElements.length < CIRCOM_LEVELS) {
    pathElements.push(0);
    pathIndices.push(0);
  }
  const root = tree[1];
  return {
    leaf,
    pathElements,
    pathIndices,
    root,
  };
}
