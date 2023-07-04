// import { createHash } from "crypto";
import * as CryptoJS from 'crypto';
import { assert, int64toBytes, int8toBytes, mergeUInt8Arrays, Uint8ArrayToHex } from "./binaryFormat";
// const { webcrypto, KeyObject } = await import('crypto');
// const { subtle } = webcrypto;
import { Hash } from "./fast-sha256";

export function shaHash(str: Uint8Array) {
  return CryptoJS.createHash('sha256').update(str).digest();
}

export function partialSha(msg: Uint8Array, msgLen: number): Uint8Array {
  const shaGadget = new Hash();
  return shaGadget.update(msg, msgLen).cacheState();
}

// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
export function sha256Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): [Uint8Array, number] {
  let length_bits = prehash_prepad_m.length * 8; // bytes to bits
  let length_in_bytes = int64toBytes(length_bits);
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7)); // Add the 1 on the end, length 505
  // while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
  while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
  }
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
  assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
  let messageLen = prehash_prepad_m.length;
  while (prehash_prepad_m.length < maxShaBytes) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int64toBytes(0));
  }
  assert(
    prehash_prepad_m.length === maxShaBytes,
    `Padding to max length did not complete properly! Your padded message is ${prehash_prepad_m.length} long but max is ${maxShaBytes}!`
  );
  return [prehash_prepad_m, messageLen];
}
