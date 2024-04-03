import * as CryptoJS from 'crypto';
import { assert, int64toBytes, int8toBytes, mergeUInt8Arrays } from "./binary-format";
import { Hash } from "./fast-sha256";

export function findIndexInUint8Array(
  array: Uint8Array,
  selector: Uint8Array
): number {
  let i = 0;
  let j = 0;
  while (i < array.length) {
    if (array[i] === selector[j]) {
      j++;
      if (j === selector.length) {
        return i - j + 1;
      }
    } else {
      j = 0;
    }
    i++;
  }
  return -1;
}

export function padUint8ArrayWithZeros(array: Uint8Array, length: number) {
  while (array.length < length) {
    array = mergeUInt8Arrays(array, int8toBytes(0));
  }
  return array;
}

export function generatePartialSHA({
  body,
  bodyLength,
  selectorString, // String to split the body
  maxRemainingBodyLength, // Maximum allowed length of the body after the selector
}: {
  body: Uint8Array;
  bodyLength: number;
  selectorString?: string;
  maxRemainingBodyLength: number;
}) {
  let selectorIndex = 0;

  // TODO: See if this (no preselector) could be handled at the circuit level
  if (selectorString) {
    const selector = new TextEncoder().encode(selectorString);
    selectorIndex = findIndexInUint8Array(body, selector);
  }

  const shaCutoffIndex = Math.floor(selectorIndex / 64) * 64;
  const precomputeText = body.slice(0, shaCutoffIndex);
  let bodyRemaining = body.slice(shaCutoffIndex);

  const bodyRemainingLength = bodyLength - precomputeText.length;

  if (bodyRemainingLength > maxRemainingBodyLength) {
    throw new Error(
      `Remaining body ${bodyRemainingLength} after the selector is longer than max (${maxRemainingBodyLength})`
    );
  }

  if (bodyRemaining.length % 64 !== 0) {
    throw new Error(`Remaining body was not padded correctly with int64s`);
  }

  bodyRemaining = padUint8ArrayWithZeros(bodyRemaining, maxRemainingBodyLength);
  const precomputedSha = partialSha(precomputeText, shaCutoffIndex);

  return {
    precomputedSha,
    bodyRemaining,
    bodyRemainingLength,
  };
}

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
