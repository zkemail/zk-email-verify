import {
  Uint8ArrayToCharArray,
  int8toBytes,
  mergeUInt8Arrays,
  toCircomBigIntBytes,
} from "./binaryFormat";
import { MAX_BODY_PADDED_BYTES, MAX_HEADER_PADDED_BYTES } from "./constants";
import { partialSha, sha256Pad, shaHash } from "./shaHash";

// Sometimes, newline encodings re-encode \r\n as just \n, so re-insert the \r so that the email hashes correctly
export function insert13Before10(a: Uint8Array): Uint8Array {
  let ret = new Uint8Array(a.length + 1000);
  let j = 0;
  for (let i = 0; i < a.length; i++) {
    // Ensure each \n is preceded by a \r
    if (a[i] === 10 && i > 0 && a[i - 1] !== 13) {
      ret[j] = 13;
      j++;
    }
    ret[j] = a[i];
    j++;
  }

  return ret.slice(0, j);
}

// Return the Uint8Array of the email after cleaning (/n -> /r/n)
export function rawEmailToBuffer(email: string) {
  const byteArray = new TextEncoder().encode(email);
  const cleaned = insert13Before10(byteArray);
  return Buffer.from(cleaned.buffer);
}

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
  selectorString: string;
  maxRemainingBodyLength: number;
}) {
  const selector = new TextEncoder().encode(selectorString);
  const selectorIndex = findIndexInUint8Array(body, selector);

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

export function generateCircuitInputs({
  rsaSignature,
  rsaModulus,
  body,
  bodyHash,
  message, // the message that was signed (header + bodyHash)
  shaPrecomputeSelector, // String to split the body for SHA pre computation
  maxMessageLength = MAX_HEADER_PADDED_BYTES, // Maximum allowed length of the message in circuit
  maxBodyLength = MAX_BODY_PADDED_BYTES, // Maximum allowed length of the body in circuit
}: {
  body: Buffer;
  message: Buffer;
  bodyHash: string;
  rsaSignature: BigInt;
  rsaModulus: BigInt;
  shaPrecomputeSelector: string;
  maxMessageLength: number;
  maxBodyLength: number;
}) {
  // SHA add padding
  const [messagePadded, messagePaddedLen] = sha256Pad(
    message,
    maxMessageLength
  );

  // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64.
  // see sha256algorithm.com for a more full explanation of padding length
  const bodySHALength = Math.floor((body.length + 63 + 65) / 64) * 64;
  const [bodyPadded, bodyPaddedLen] = sha256Pad(
    body,
    Math.max(maxBodyLength, bodySHALength)
  );

  const { precomputedSha, bodyRemaining, bodyRemainingLength } =
    generatePartialSHA({
      body: bodyPadded,
      bodyLength: bodyPaddedLen,
      selectorString: shaPrecomputeSelector,
      maxRemainingBodyLength: maxBodyLength,
    });

  const bodyHashIndex = message.toString().indexOf(bodyHash).toString();

  const circuitInputs = {
    in_padded: Uint8ArrayToCharArray(messagePadded), // Packed into 1 byte signals
    modulus: toCircomBigIntBytes(rsaModulus),
    signature: toCircomBigIntBytes(rsaSignature),
    in_len_padded_bytes: messagePaddedLen.toString(),
    precomputed_sha: Uint8ArrayToCharArray(precomputedSha),
    in_body_padded: Uint8ArrayToCharArray(bodyRemaining),
    in_body_len_padded_bytes: bodyRemainingLength.toString(),
    body_hash_idx: bodyHashIndex,
  };

  return circuitInputs;
}
