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

// https://stackoverflow.com/a/69585881
const HEX_STRINGS = "0123456789abcdef";
const MAP_HEX = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
} as const;

// Fast Uint8Array to hex
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes || [])
    .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
    .join("");
}

// Mimics Buffer.from(x, 'hex') logic
// Stops on first non-hex string and returns
// https://github.com/nodejs/node/blob/v14.18.1/src/string_bytes.cc#L246-L261
export function fromHex(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor((hexString || "").length / 2));
  let i;
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hexString[i * 2] as keyof typeof MAP_HEX];
    const b = MAP_HEX[hexString[i * 2 + 1] as keyof typeof MAP_HEX];
    if (a === undefined || b === undefined) {
      break;
    }
    bytes[i] = (a << 4) | b;
  }
  return i === bytes.length ? bytes : bytes.slice(0, i);
}
