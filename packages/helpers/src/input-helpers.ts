import {
  Uint8ArrayToCharArray,
  toCircomBigIntBytes,
} from "./binaryFormat";
import { MAX_BODY_PADDED_BYTES, MAX_HEADER_PADDED_BYTES } from "./constants";
import { generatePartialSHA, sha256Pad } from "./shaHash";


type CircuitInput = {
  emailHeader: string[];
  emailHeaderLength: string;
  pubkey: string[];
  signature: string[];
  emailBody?: string[];
  emailBodyLength?: string;
  precomputedSHA?: string[];
  bodyHashIndex?: string;
};

export function generateCircuitInputs(params: {
  headers: Buffer;
  rsaSignature: BigInt;
  rsaPublicKey: BigInt;
  body?: Buffer;
  bodyHash?: string;
  shaPrecomputeSelector?: string;
  maxMessageLength?: number;
  maxBodyLength?: number;
  ignoreBodyHashCheck?: boolean;
}): CircuitInput {
  const {
    rsaSignature,
    rsaPublicKey,
    body,
    bodyHash,
    headers,
    shaPrecomputeSelector, // String to split the body for SHA pre computation
    maxMessageLength = MAX_HEADER_PADDED_BYTES, // Maximum allowed length of the message in circuit
    maxBodyLength = MAX_BODY_PADDED_BYTES, // Maximum allowed length of the body in circuit
    ignoreBodyHashCheck = false, // To be used when ignore_body_hash_check is true in circuit
  } = params;

  // SHA add padding
  const [messagePadded, messagePaddedLen] = sha256Pad(
    headers,
    maxMessageLength
  );

  const circuitInputs: CircuitInput = {
    emailHeader: Uint8ArrayToCharArray(messagePadded), // Packed into 1 byte signals
    emailHeaderLength: messagePaddedLen.toString(),
    pubkey: toCircomBigIntBytes(rsaPublicKey),
    signature: toCircomBigIntBytes(rsaSignature),
  };

  if (!ignoreBodyHashCheck) {
    if (!body || !bodyHash) {
      throw new Error(
        `body and bodyHash are required when ignoreBodyHashCheck is false`
      );
    }

    const bodyHashIndex = headers.toString().indexOf(bodyHash);

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

    circuitInputs.emailBodyLength = bodyRemainingLength.toString();
    circuitInputs.precomputedSHA = Uint8ArrayToCharArray(precomputedSha);
    circuitInputs.bodyHashIndex = bodyHashIndex.toString();
    circuitInputs.emailBody = Uint8ArrayToCharArray(bodyRemaining);
  }

  return circuitInputs;
}
