import * as CryptoJS from 'crypto';
import { assert, int64toBytes, int8toBytes, mergeUInt8Arrays } from './binary-format';
import { Hash } from './lib/fast-sha256';

export function findIndexInUint8Array(array: Uint8Array, selector: Uint8Array): number {
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
    // eslint-disable-next-line no-param-reassign
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

  if (selectorString) {
    const selector = new TextEncoder().encode(selectorString);
    selectorIndex = findIndexInUint8Array(body, selector);

    if (selectorIndex === -1) {
      throw new Error(`SHA precompute selector "${selectorString}" not found in the body`);
    }
  }

  const shaCutoffIndex = Math.floor(selectorIndex / 64) * 64;
  const precomputeText = body.slice(0, shaCutoffIndex);
  let bodyRemaining = body.slice(shaCutoffIndex);

  const bodyRemainingLength = bodyLength - precomputeText.length;

  if (bodyRemainingLength > maxRemainingBodyLength) {
    throw new Error(
      `Remaining body ${bodyRemainingLength} after the selector is longer than max (${maxRemainingBodyLength})`,
    );
  }

  if (bodyRemaining.length % 64 !== 0) {
    throw new Error('Remaining body was not padded correctly with int64s');
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
export function sha256Pad(message: Uint8Array, maxShaBytes: number): [Uint8Array, number] {
  const msgLen = message.length * 8; // bytes to bits
  const msgLenBytes = int64toBytes(msgLen);

  let res = mergeUInt8Arrays(message, int8toBytes(2 ** 7)); // Add the 1 on the end, length 505
  // while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
  while ((res.length * 8 + msgLenBytes.length * 8) % 512 !== 0) {
    res = mergeUInt8Arrays(res, int8toBytes(0));
  }

  res = mergeUInt8Arrays(res, msgLenBytes);
  assert((res.length * 8) % 512 === 0, 'Padding did not complete properly!');
  const messageLen = res.length;
  while (res.length < maxShaBytes) {
    res = mergeUInt8Arrays(res, int64toBytes(0));
  }

  assert(
    res.length === maxShaBytes,
    `Padding to max length did not complete properly! Your padded message is ${res.length} long but max is ${maxShaBytes}!`,
  );

  return [res, messageLen];
}
