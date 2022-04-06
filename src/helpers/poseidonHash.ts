// @ts-ignore
import { buildPoseidon } from "circomlibjs";

let poseidonHasher: any;
export async function initializePoseidon() {
  if (!poseidonHasher) {
    poseidonHasher = await buildPoseidon();
  }
}
export const poseidon = (arr: (number | bigint | string)[]): string =>
  poseidonHasher.F.toString(poseidonHasher(arr));

export const poseidonK = (ar: (number | bigint | string)[]): string => {
  let cur: (number | bigint | string)[] = [];
  for (const elt of ar) {
    cur.push(elt);
    if (cur.length === 16) {
      cur = [poseidon(cur)];
    }
  }
  if (cur.length === 1) return `${cur[0]}`;
  while (cur.length < 16) cur.push(0);
  return poseidon(cur);
};
