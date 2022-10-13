import { CIRCOM_BIGINT_N, CIRCOM_BIGINT_K } from "./constants";

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function stringToBytes(str: string) {
  const encodedText = new TextEncoder().encode(str);
  const toReturn = Uint8Array.from(str, (x) => x.charCodeAt(0));
  const buf = Buffer.from(str, "utf8");
  return toReturn;
  // TODO: Check encoding mismatch if the proof doesnt work
  // Note that our custom encoding function maps (239, 191, 189) -> (253)
  // Note that our custom encoding function maps (207, 181) -> (245)
  // throw Error(
  //   "TextEncoder does not match string2bytes function" +
  //     "\n" +
  //     str +
  //     "\n" +
  //     buf +
  //     "\n" +
  //     Uint8Array.from(buf) +
  //     "\n" +
  //     JSON.stringify(encodedText) +
  //     "\n" +
  //     JSON.stringify(toReturn)
  // );
}

export function bufferToUint8Array(buf: Buffer): Uint8Array {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return Uint8Array.from(view);
}

export function bufferToString(buf: Buffer): String {
  let intermediate = bufferToUint8Array(buf);
  return bytesToString(intermediate);
}

export function bytesToBigInt(bytes: Uint8Array) {
  let res = 0n;
  for (let i = 0; i < bytes.length; ++i) {
    res = (res << 8n) + BigInt(bytes[i]);
  }
  return res;
}

export function toCircomBigIntBytes(num: BigInt | bigint) {
  const res = [];
  const bigintNum: bigint = typeof num == "bigint" ? num : num.valueOf();
  const msk = (1n << BigInt(CIRCOM_BIGINT_N)) - 1n;
  for (let i = 0; i < CIRCOM_BIGINT_K; ++i) {
    res.push(((bigintNum >> BigInt(i * CIRCOM_BIGINT_N)) & msk).toString());
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
  let hexStringTrimmed: string = hexString;
  if(hexString[0] === "0" && hexString[1] === "x") {
    hexStringTrimmed = hexString.slice(2);
  }
  const bytes = new Uint8Array(Math.floor((hexStringTrimmed || "").length / 2));
  let i;
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hexStringTrimmed[i * 2] as keyof typeof MAP_HEX];
    const b = MAP_HEX[hexStringTrimmed[i * 2 + 1] as keyof typeof MAP_HEX];
    if (a === undefined || b === undefined) {
      break;
    }
    bytes[i] = (a << 4) | b;
  }
  return i === bytes.length ? bytes : bytes.slice(0, i);
}

export function packedNBytesToString(packedBytes: bigint[], n: number = 7): string {
  let chars: number[] = [];
  for (let i = 0; i < packedBytes.length; i++) {
    for (var k = 0n; k < n; k++) {
      chars.push(Number((packedBytes[i] >> (k * 8n)) % 256n));
    }
  }
  return bytesToString(Uint8Array.from(chars));
}


export function packBytesIntoNBytes(messagePaddedRaw: Uint8Array | string, n = 7): Array<bigint> {
  const messagePadded: Uint8Array = typeof messagePaddedRaw === "string" ? stringToBytes(messagePaddedRaw) : messagePaddedRaw;
  let output: Array<bigint> = [];
  for (let i = 0; i < messagePadded.length; i++) {
    if (i % n === 0) {
      output.push(0n);
    }
    const j = (i / n) | 0;
    console.assert(j === output.length - 1, "Not editing the index of the last element -- packing loop invariants bug!");
    output[j] += BigInt(messagePadded[i]) << BigInt((i % n) * 8);
  }
  return output;
}
// Usage: let in_padded_n_bytes = packBytesIntoNBytes(messagePadded, 7).map((x) => x.toString()); // Packed into 7 byte signals

// console.log(packedNBytesToString([30680772461461504n, 129074054722665n, 30794022159122432n, 30803244232763745n]));
