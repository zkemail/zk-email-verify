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
  decodedEmailBodyIn?: string[];
  headerMask?: number[];
  bodyMask?: number[];
};

type InputGenerationArgs = {
  ignoreBodyHashCheck?: boolean;
  enableHeaderMasking?: boolean;
  enableBodyMasking?: boolean;
  shaPrecomputeSelector?: string;
  maxHeadersLength?: number; // Max length of the email header including padding
  maxBodyLength?: number; // Max length of the email body after shaPrecomputeSelector including padding
  removeSoftLineBreaks?: boolean;
  headerMask?: number[];
  bodyMask?: number[];
};

type DKIMVerificationArgs = {
  domain?: string;
  enableSanitization?: boolean;
  fallbackToZKEmailDNSArchive?: boolean;
};

/**
 * Finds a selector string in cleaned content and maps it back to its original position.
 *
 * @param cleanContent - Uint8Array of content with soft line breaks removed
 * @param selector - String to find in the cleaned content
 * @param positionMap - Map of cleaned content indices to original content indices
 * @returns Object containing the selector and its position in original content
 * @throws Error if selector not found or position mapping fails
 *
 * @example
 * cleanContent: "HelloWorld"
 * selector: "World"
 * positionMap: { 5->8 } (due to removed "=\r\n")
 * returns: { selector: "World", originalIndex: 8 }
 */
function findSelectorInCleanContent(
  cleanContent: Uint8Array,
  selector: string,
  positionMap: Map<number, number>,
): { selector: string; originalIndex: number } {
  const cleanString = new TextDecoder().decode(cleanContent);
  const selectorIndex = cleanString.indexOf(selector);

  if (selectorIndex === -1) {
    throw new Error(`SHA precompute selector "${selector}" not found in cleaned body`);
  }

  const originalIndex = positionMap.get(selectorIndex);
  if (originalIndex === undefined) {
    throw new Error(`Failed to map selector position to original body`);
  }

  return { selector, originalIndex };
}

/**
 * Gets the adjusted selector string that accounts for potential soft line breaks in QP encoding.
 * If the selector exists in original body, returns it as-is. Otherwise, finds it in cleaned content
 * and maps it back to the original format including any soft line breaks.
 *
 * @param originalBody - Original Uint8Array with potential soft line breaks
 * @param selector - String to find in the content
 * @param cleanContent - Uint8Array with soft line breaks removed
 * @param positionMap - Map of cleaned content indices to original content indices
 * @returns Adjusted selector string that matches the original body format
 *
 * @example
 * originalBody: "Hel=\r\nlo"
 * selector: "Hello"
 * returns: "Hel=\r\nlo"
 */
function getAdjustedSelector(
  originalBody: Uint8Array,
  selector: string,
  cleanContent: Uint8Array,
  positionMap: Map<number, number>,
): string {
  // First try finding selector in original body
  if (new TextDecoder().decode(originalBody).includes(selector)) {
    return selector;
  }

  // If not found, look in cleaned content and map back to original
  const { originalIndex } = findSelectorInCleanContent(cleanContent, selector, positionMap);
  const bodyString = new TextDecoder().decode(originalBody);

  // Add 3 to length to account for potential soft line break
  return bodyString.slice(originalIndex, originalIndex + selector.length + 3);
}

/**
 * Removes soft line breaks from a Quoted-Printable encoded byte array while maintaining a mapping
 * between cleaned and original positions.
 *
 * Soft line breaks in QP encoding are sequences of "=\r\n" (hex: 3D0D0A) that are used to split long lines.
 * These breaks should be removed when decoding the content while preserving the original content.
 *
 * @param body - Uint8Array containing QP encoded content
 * @returns {QPDecodeResult} Object containing:
 *   - cleanContent: Uint8Array with soft line breaks removed, padded with zeros to match original length
 *   - positionMap: Map of indices from cleaned content to original content positions
 *
 * @example
 * Input:  Hello=\r\nWorld  ([72,101,108,108,111,61,13,10,87,111,114,108,100])
 * Output: {
 *   cleanContent: [72,101,108,108,111,87,111,114,108,100,0,0,0],
 *   positionMap: { 0->0, 1->1, 2->2, 3->3, 4->4, 5->8, 6->9, 7->10, 8->11, 9->12 }
 * }
 */
function removeSoftLineBreaks(body: Uint8Array): { cleanContent: Uint8Array; positionMap: Map<number, number> } {
  const result = [];
  const positionMap = new Map<number, number>(); // clean -> original
  let i = 0;
  let cleanPos = 0;

  while (i < body.length) {
    if (
      i + 2 < body.length &&
      body[i] === 61 && // '=' character
      body[i + 1] === 13 && // '\r' character
      body[i + 2] === 10 // '\n' character
    ) {
      i += 3; // Move past the soft line break
    } else {
      positionMap.set(cleanPos, i);
      result.push(body[i]);
      cleanPos++;
      i++;
    }
  }

  // Pad the result with zeros to make it the same length as body
  while (result.length < body.length) {
    result.push(0);
  }

  return {
    cleanContent: new Uint8Array(result),
    positionMap,
  };
}

/**
 *
 * @description Generate circuit inputs for the EmailVerifier circuit from raw email content
 * @param rawEmail Full email content as a buffer or string
 * @param inputParams Arguments to control the input generation
 * @param dkimVerificationArgs Arguments to control the DKIM verification
 * @returns Circuit inputs for the EmailVerifier circuit
 */
export async function generateEmailVerifierInputs(
  rawEmail: Buffer | string,
  inputParams: InputGenerationArgs = {},
  dkimVerificationArgs: DKIMVerificationArgs = {},
) {
  const dkimResult = await verifyDKIMSignature(
    rawEmail,
    dkimVerificationArgs.domain,
    dkimVerificationArgs.enableSanitization,
    dkimVerificationArgs.fallbackToZKEmailDNSArchive,
  );

  return generateEmailVerifierInputsFromDKIMResult(dkimResult, inputParams);
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
  const { headers, body, bodyHash, publicKey, signature } = dkimResult;

  // SHA add padding
  const [messagePadded, messagePaddedLen] = sha256Pad(headers, params.maxHeadersLength || MAX_HEADER_PADDED_BYTES);

  const circuitInputs: CircuitInput = {
    emailHeader: Uint8ArrayToCharArray(messagePadded), // Packed into 1 byte signals
    emailHeaderLength: messagePaddedLen.toString(),
    pubkey: toCircomBigIntBytes(publicKey),
    signature: toCircomBigIntBytes(signature),
  };

  if (params.enableHeaderMasking) {
    circuitInputs.headerMask = params.headerMask;
  }

  if (!params.ignoreBodyHashCheck) {
    if (!body || !bodyHash) {
      throw new Error('body and bodyHash are required when ignoreBodyHashCheck is false');
    }

    const bodyHashIndex = headers.toString().indexOf(bodyHash);
    const maxBodyLength = params.maxBodyLength || MAX_BODY_PADDED_BYTES;

    // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64.
    // see sha256algorithm.com for a more full explanation of padding length
    const bodySHALength = Math.floor((body.length + 63 + 65) / 64) * 64;
    const [bodyPadded, bodyPaddedLen] = sha256Pad(body, Math.max(maxBodyLength, bodySHALength));

    let adjustedSelector = params.shaPrecomputeSelector;
    if (params.shaPrecomputeSelector) {
      const { cleanContent, positionMap } = removeSoftLineBreaks(bodyPadded);
      adjustedSelector = getAdjustedSelector(body, params.shaPrecomputeSelector, cleanContent, positionMap);
    }

    const { precomputedSha, bodyRemaining, bodyRemainingLength } = generatePartialSHA({
      body: bodyPadded,
      bodyLength: bodyPaddedLen,
      selectorString: adjustedSelector,
      maxRemainingBodyLength: maxBodyLength,
    });

    circuitInputs.emailBodyLength = bodyRemainingLength.toString();
    circuitInputs.precomputedSHA = Uint8ArrayToCharArray(precomputedSha);
    circuitInputs.bodyHashIndex = bodyHashIndex.toString();
    circuitInputs.emailBody = Uint8ArrayToCharArray(bodyRemaining);

    if (params.removeSoftLineBreaks) {
      const { cleanContent } = removeSoftLineBreaks(bodyRemaining);
      circuitInputs.decodedEmailBodyIn = Uint8ArrayToCharArray(cleanContent);
    }

    if (params.enableBodyMasking) {
      circuitInputs.bodyMask = params.bodyMask;
    }
  }

  return circuitInputs;
}
