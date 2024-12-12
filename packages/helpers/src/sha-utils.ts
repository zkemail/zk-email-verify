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
    // First remove soft line breaks and get position mapping
    const cleanContent = new Uint8Array(body);
    const positionMap = new Map<number, number>();
    let cleanPos = 0;
    let i = 0;

    // Build clean content and position map
    while (i < body.length) {
      if (i < body.length - 1 && body[i] === 61) { // '=' character
        // Check for multi-byte UTF-8 sequence in QP format
        const qpMatch = body.slice(i, i + 9).toString().match(/^=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/);
        if (qpMatch) {
          // Handle 3-byte UTF-8 sequence
          const byte1 = parseInt(qpMatch[1], 16);
          const byte2 = parseInt(qpMatch[2], 16);
          const byte3 = parseInt(qpMatch[3], 16);
          cleanContent[cleanPos] = byte1;
          cleanContent[cleanPos + 1] = byte2;
          cleanContent[cleanPos + 2] = byte3;
          positionMap.set(cleanPos, i);
          positionMap.set(cleanPos + 1, i + 3);
          positionMap.set(cleanPos + 2, i + 6);
          cleanPos += 3;
          i += 9;
          continue;
        }

        // Check for line continuation
        let j = i + 1;
        while (j < body.length && (body[j] === 13 || body[j] === 10 || body[j] === 32 || body[j] === 9)) {
          j++;
        }
        if (j > i + 1) {
          i = j;
          continue;
        }
      }
      positionMap.set(cleanPos, i);
      cleanContent[cleanPos] = body[i];
      cleanPos++;
      i++;
    }

    // Create a view of only the valid content
    const validContent = cleanContent.slice(0, cleanPos);

    // Find selector in decoded content
    const cleanString = new TextDecoder().decode(validContent);
    selectorIndex = cleanString.indexOf(selectorString);

    if (selectorIndex === -1) {
      throw new Error(`SHA precompute selector "${selectorString}" not found in the body`);
    }

    // Map back to original position
    const originalIndex = positionMap.get(selectorIndex);
    if (originalIndex === undefined) {
      throw new Error(`Failed to map selector position to original body`);
    }

    selectorIndex = originalIndex;
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
