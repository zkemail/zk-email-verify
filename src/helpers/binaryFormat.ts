import { CIRCOM_BIGINT_N, CIRCOM_BIGINT_K } from "./constants";

export function stringToBytes(str: string) {
  return Uint8Array.from(str, (x) => x.charCodeAt(0));
}


export function bytesToBigInt(bytes: Uint8Array) {
  let res = 0n;
  for (let i = 0; i < bytes.length; ++i) {
    res = (res << 8n) + BigInt(bytes[i]);
  }
  return res;
}

export function toCircomBigIntBytes(num: bigint) {
  const res = [];
  const msk = (1n << BigInt(CIRCOM_BIGINT_N)) - 1n;
  for (let i = 0; i < CIRCOM_BIGINT_K; ++i) {
    res.push(((num >> BigInt(i * CIRCOM_BIGINT_N)) & msk).toString());
  }
  return res;
}
