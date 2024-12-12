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

  let shaCutoffIndex = bodyLength;

  if (selectorString) {
    // Convert to Buffer for consistent handling
    const bodyBuffer = Buffer.from(body);
    const result: number[] = [];
    const positionMap = new Map<number, number>(); // decoded -> original
    let i = 0;
    let decodedPos = 0;

    // Helper function to decode QP string
    const decodeQP = (str: string): string => {
      return str.replace(/=([0-9A-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
    };

    // First decode the selector if it's QP-encoded
    const decodedSelector = decodeQP(selectorString);

    while (i < bodyBuffer.length) {
      // Skip soft line breaks
      if (i < bodyBuffer.length - 2 &&
          bodyBuffer[i] === 61 && // '='
          bodyBuffer[i + 1] === 13 && // '\r'
          bodyBuffer[i + 2] === 10) { // '\n'
        i += 3;
        continue;
      }

      // Handle QP sequences
      if (i < bodyBuffer.length - 2 && bodyBuffer[i] === 61) { // '='
        const nextTwo = bodyBuffer.slice(i + 1, i + 3).toString();
        if (/[0-9A-F]{2}/.test(nextTwo)) {
          const byte = parseInt(nextTwo, 16);
          result.push(byte);
          positionMap.set(decodedPos, i);
          decodedPos++;
          i += 3;
          continue;
        }
      }

      result.push(bodyBuffer[i]);
      positionMap.set(decodedPos, i);
      decodedPos++;
      i++;
    }

    // Convert decoded content to string for searching
    const decoder = new TextDecoder();
    const decodedStr = decoder.decode(new Uint8Array(result));

    // Find the selector in decoded content
    const selectorIndex = decodedStr.indexOf(decodedSelector);
    if (selectorIndex === -1) {
      throw new Error(`SHA precompute selector "${decodedSelector}" not found in body`);
    }

    // Map back to original position
    const originalIndex = positionMap.get(selectorIndex);
    if (originalIndex === undefined) {
      throw new Error('Failed to map selector position back to original content');
    }

    shaCutoffIndex = originalIndex;
  }

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
  const slicedBody = new Uint8Array(body.slice(shaCutoffIndex));
  bodyRemaining.set(slicedBody);

  if (bodyRemaining.length < maxRemainingBodyLength) {
    return {
      bodyRemaining: padUint8ArrayWithZeros(bodyRemaining, maxRemainingBodyLength),
      precomputedSha: partialSha(body.slice(0, shaCutoffIndex), shaCutoffIndex),
      bodyRemainingLength: bodyRemaining.length
    };
  }

  return {
    bodyRemaining,
    precomputedSha: partialSha(body.slice(0, shaCutoffIndex), shaCutoffIndex),
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
