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
  // Convert cleanContent to Buffer for consistent type handling
  const cleanBuffer: Buffer = Buffer.from(cleanContent);

  // First build a clean string without soft line breaks
  const cleanString = cleanBuffer.toString();
  let decodedString = '';
  let cleanIndex = 0;
  const indexMap = new Map<number, number>(); // decodedPos -> cleanPos

  while (cleanIndex < cleanString.length) {
    // Handle multi-byte UTF-8 sequences in QP format (e.g., =E2=80=94 for em dash)
    const qpMatch = cleanString.slice(cleanIndex).match(/^=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/);
    if (qpMatch) {
      const byte1 = parseInt(qpMatch[1], 16);
      const byte2 = parseInt(qpMatch[2], 16);
      const byte3 = parseInt(qpMatch[3], 16);
      const bytes = Buffer.from([byte1, byte2, byte3]);
      decodedString += bytes.toString();
      indexMap.set(decodedString.length - 1, cleanIndex);
      cleanIndex += 9; // Skip over the entire QP sequence
      continue;
    }

    // Handle single-byte QP sequences
    if (cleanString[cleanIndex] === '=' &&
        /[0-9A-F]{2}/.test(cleanString.slice(cleanIndex + 1, cleanIndex + 3))) {
      const byte = parseInt(cleanString.slice(cleanIndex + 1, cleanIndex + 3), 16);
      decodedString += String.fromCharCode(byte);
      indexMap.set(decodedString.length - 1, cleanIndex);
      cleanIndex += 3;
    } else {
      decodedString += cleanString[cleanIndex];
      indexMap.set(decodedString.length - 1, cleanIndex);
      cleanIndex++;
    }
  }

  const selectorIndex = decodedString.indexOf(selector);

  if (selectorIndex === -1) {
    throw new Error(`SHA precompute selector "${selector}" not found in cleaned body`);
  }

  // Map back to original position using our index maps
  const cleanPos = indexMap.get(selectorIndex);
  if (cleanPos === undefined) {
    throw new Error(`Failed to map selector position in decoded content`);
  }

  const originalIndex = positionMap.get(cleanPos);
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
  const decoder = new TextDecoder();
  const originalString = decoder.decode(originalBody);

  // Look in cleaned and decoded content and map back to original
  const { originalIndex } = findSelectorInCleanContent(cleanContent, selector, positionMap);

  // Find the end of the QP sequence by looking for multi-byte UTF-8 characters
  let encodedLength = 0;
  let currentIndex = originalIndex;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    if (char.charCodeAt(0) > 127) {
      // Look for QP-encoded multi-byte sequence
      const qpMatch = originalString.slice(currentIndex).match(/^=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/);
      if (qpMatch) {
        encodedLength += 9; // Length of =XX=XX=XX
        currentIndex += 9;
        continue;
      }
    }
    // Look for single-byte QP sequence or regular character
    if (originalString[currentIndex] === '=' &&
        /[0-9A-F]{2}/.test(originalString.slice(currentIndex + 1, currentIndex + 3))) {
      encodedLength += 3;
      currentIndex += 3;
    } else {
      encodedLength++;
      currentIndex++;
    }
  }

  return originalString.slice(originalIndex, originalIndex + encodedLength);
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
  // Convert to Buffer for consistent handling
  const bodyBuffer: Buffer = Buffer.from(body);
  const result: number[] = [];
  const positionMap = new Map<number, number>(); // clean -> original
  let i = 0;
  let cleanPos = 0;

  while (i < bodyBuffer.length) {
    // Handle multi-byte UTF-8 sequences in QP format (e.g., =E2=80=94 for em dash)
    if (i < bodyBuffer.length - 8 && bodyBuffer[i] === 61) { // '=' character
      const slice = bodyBuffer.slice(i, i + 9);
      const str = slice.toString();
      const qpMatch = str.match(/^=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/);
      if (qpMatch) {
        const byte1 = parseInt(qpMatch[1], 16);
        const byte2 = parseInt(qpMatch[2], 16);
        const byte3 = parseInt(qpMatch[3], 16);
        result.push(byte1, byte2, byte3);
        positionMap.set(cleanPos, i);
        positionMap.set(cleanPos + 1, i);
        positionMap.set(cleanPos + 2, i);
        cleanPos += 3;
        i += 9;
        continue;
      }
    }

    // Check for soft line break
    if (i < bodyBuffer.length - 2 &&
        bodyBuffer[i] === 61 && // '='
        bodyBuffer[i + 1] === 13 && // '\r'
        bodyBuffer[i + 2] === 10) { // '\n'
      i += 3; // Skip the soft line break
      continue;
    }

    // Handle single-byte QP sequences
    if (i < bodyBuffer.length - 2 && bodyBuffer[i] === 61) { // '='
      const nextTwo = bodyBuffer.slice(i + 1, i + 3).toString();
      if (/[0-9A-F]{2}/.test(nextTwo)) {
        const byte = parseInt(nextTwo, 16);
        result.push(byte);
        positionMap.set(cleanPos, i);
        cleanPos++;
        i += 3;
        continue;
      }
    }

    result.push(bodyBuffer[i]);
    positionMap.set(cleanPos, i);
    cleanPos++;
    i++;
  }

  // Create final Uint8Array with proper length
  const cleanContent = new Uint8Array(result);
  return { cleanContent, positionMap };
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
  // Convert string to Buffer if needed, ensuring consistent Buffer type
  const emailBuffer: Buffer = typeof rawEmail === 'string'
    ? Buffer.from(rawEmail)
    : (rawEmail as Buffer);

  const dkimResult = await verifyDKIMSignature(
    emailBuffer,
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

    // First remove soft line breaks to ensure QP sequences aren't broken
    const { cleanContent: contentWithoutBreaks } = removeSoftLineBreaks(bodyRemaining);

    // Then decode QP-encoded content
    const decodedContent = Buffer.alloc(contentWithoutBreaks.length);
    let writePos = 0;
    let readPos = 0;

    while (readPos < contentWithoutBreaks.length) {
      // Handle multi-byte UTF-8 sequences
      if (readPos < contentWithoutBreaks.length - 8 && contentWithoutBreaks[readPos] === 61) { // '=' character
        const slice = Buffer.from(contentWithoutBreaks.slice(readPos, readPos + 9));
        const str = slice.toString();
        const qpMatch = str.match(/^=([0-9A-F]{2})=([0-9A-F]{2})=([0-9A-F]{2})/);
        if (qpMatch) {
          const byte1 = parseInt(qpMatch[1], 16);
          const byte2 = parseInt(qpMatch[2], 16);
          const byte3 = parseInt(qpMatch[3], 16);
          decodedContent[writePos++] = byte1;
          decodedContent[writePos++] = byte2;
          decodedContent[writePos++] = byte3;
          readPos += 9;
          continue;
        }
      }

      // Handle single-byte QP sequences
      if (readPos < contentWithoutBreaks.length - 2 && contentWithoutBreaks[readPos] === 61) {
        const nextTwo = Buffer.from(contentWithoutBreaks.slice(readPos + 1, readPos + 3)).toString();
        if (/[0-9A-F]{2}/.test(nextTwo)) {
          decodedContent[writePos++] = parseInt(nextTwo, 16);
          readPos += 3;
          continue;
        }
      }

      decodedContent[writePos++] = contentWithoutBreaks[readPos++];
    }

    const finalDecodedContent = Buffer.from(decodedContent.slice(0, writePos));
    circuitInputs.emailBody = Uint8ArrayToCharArray(new Uint8Array(finalDecodedContent));

    if (params.removeSoftLineBreaks) {
      circuitInputs.decodedEmailBodyIn = circuitInputs.emailBody;
    }

    if (params.enableBodyMasking) {
      circuitInputs.bodyMask = params.bodyMask;
    }
  }

  return circuitInputs;
}
