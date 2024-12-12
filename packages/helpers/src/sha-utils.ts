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

export function padUint8ArrayWithZeros(array: Uint8Array, length: number): Uint8Array {
  const buffer = new ArrayBuffer(Math.max(array.length, length));
  const result = new Uint8Array(buffer);
  result.set(array);
  return result;
}

export function generatePartialSHA({
  body,
  bodyLength,
  selectorString,
  maxRemainingBodyLength,
}: {
  body: Uint8Array;
  bodyLength: number;
  selectorString?: string;
  maxRemainingBodyLength: number;
}): {
  bodyRemaining: Uint8Array;
  precomputedSha: Uint8Array;
  bodyRemainingLength: number;
} {
  if (!body || !(body instanceof Uint8Array)) {
    throw new Error('Invalid input: body must be a Uint8Array');
  }

  const precomputeText = selectorString ? Buffer.from(selectorString) : body;
  const shaCutoffIndex = selectorString ? body.indexOf(precomputeText[0]) : bodyLength;

  if (shaCutoffIndex < 0) {
    throw new Error('Negative sha cutoff index');
  }
  if (shaCutoffIndex > body.length) {
    throw new Error('Sha cutoff index greater than body length');
  }
  if (maxRemainingBodyLength % 64 !== 0) {
    throw new Error('Remaining body was not padded correctly with int64s');
  }

  const buffer = new ArrayBuffer(maxRemainingBodyLength);
  const bodyRemaining = new Uint8Array(buffer);
  const slicedBody = new Uint8Array(body.buffer, shaCutoffIndex);
  bodyRemaining.set(slicedBody);

  if (bodyRemaining.length < maxRemainingBodyLength) {
    return {
      bodyRemaining: padUint8ArrayWithZeros(bodyRemaining, maxRemainingBodyLength),
      precomputedSha: partialSha(precomputeText, shaCutoffIndex),
      bodyRemainingLength: bodyRemaining.length
    };
  }

  return {
    bodyRemaining,
    precomputedSha: partialSha(precomputeText, shaCutoffIndex),
    bodyRemainingLength: bodyRemaining.length
  };
}

export function shaHash(str: Uint8Array) {
  return CryptoJS.createHash('sha256').update(str).digest();
}

export function partialSha(msg: Uint8Array, msgLen: number): Uint8Array {
  const shaGadget = new Hash();
  return shaGadget.update(msg, msgLen).cacheState();
}

export function sha256Pad(message: Uint8Array, maxShaBytes: number): [Uint8Array, number] {
  const msgLen = message.length * 8;
  const msgLenBytes = int64toBytes(msgLen);

  let res = mergeUInt8Arrays(message, int8toBytes(2 ** 7));
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
