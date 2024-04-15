import { Uint8ArrayToCharArray, toCircomBigIntBytes } from './binary-format';
import { MAX_BODY_PADDED_BYTES, MAX_HEADER_PADDED_BYTES } from './constants';
import { DKIMVerificationResult, verifyDKIMSignature } from './dkim';
import { generatePartialSHA, sha256Pad } from './sha-utils';

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

type InputGenerationArgs = {
  ignoreBodyHashCheck?: boolean;
  shaPrecomputeSelector?: string;
  maxHeadersLength?: number; // Max length of the email header including padding
  maxBodyLength?: number; // Max length of the email body after shaPrecomputeSelector including padding
};

/**
 *
 * @description Generate circuit inputs for the EmailVerifier circuit from raw email content
 * @param rawEmail Full email content as a buffer or string
 * @param params Arguments to control the input generation
 * @returns Circuit inputs for the EmailVerifier circuit
 */
export async function generateEmailVerifierInputs(
  rawEmail: Buffer | string,
  params: InputGenerationArgs = {},
) {
  const dkimResult = await verifyDKIMSignature(rawEmail);

  return generateEmailVerifierInputsFromDKIMResult(
    dkimResult,
    params,
  );
}

/**
 *
 * @description Generate circuit inputs for the EmailVerifier circuit from DKIMVerification result
 * @param dkimResult DKIMVerificationResult containing email data and verification result
 * @param params Arguments to control the input generation
 * @returns Circuit inputs for the EmailVerifier circuit
 */
export function generateEmailVerifierInputsFromDKIMResult(
  dkimResult: DKIMVerificationResult,
  params: InputGenerationArgs = {},
): CircuitInput {
  const {
    headers, body, bodyHash, publicKey, signature,
  } = dkimResult;

  // SHA add padding
  const [messagePadded, messagePaddedLen] = sha256Pad(
    headers,
    params.maxHeadersLength || MAX_HEADER_PADDED_BYTES,
  );

  const circuitInputs: CircuitInput = {
    emailHeader: Uint8ArrayToCharArray(messagePadded), // Packed into 1 byte signals
    emailHeaderLength: messagePaddedLen.toString(),
    pubkey: toCircomBigIntBytes(publicKey),
    signature: toCircomBigIntBytes(signature),
  };

  if (!params.ignoreBodyHashCheck) {
    if (!body || !bodyHash) {
      throw new Error(
        'body and bodyHash are required when ignoreBodyHashCheck is false',
      );
    }

    const bodyHashIndex = headers.toString().indexOf(bodyHash);
    const maxBodyLength = params.maxBodyLength || MAX_BODY_PADDED_BYTES;

    // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64.
    // see sha256algorithm.com for a more full explanation of padding length
    const bodySHALength = Math.floor((body.length + 63 + 65) / 64) * 64;
    const [bodyPadded, bodyPaddedLen] = sha256Pad(
      body,
      Math.max(maxBodyLength, bodySHALength),
    );

    const { precomputedSha, bodyRemaining, bodyRemainingLength } = generatePartialSHA({
      body: bodyPadded,
      bodyLength: bodyPaddedLen,
      selectorString: params.shaPrecomputeSelector,
      maxRemainingBodyLength: maxBodyLength,
    });

    circuitInputs.emailBodyLength = bodyRemainingLength.toString();
    circuitInputs.precomputedSHA = Uint8ArrayToCharArray(precomputedSha);
    circuitInputs.bodyHashIndex = bodyHashIndex.toString();
    circuitInputs.emailBody = Uint8ArrayToCharArray(bodyRemaining);
  }

  return circuitInputs;
}
