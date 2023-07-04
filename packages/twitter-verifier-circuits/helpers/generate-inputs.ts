import { bytesToBigInt, fromHex } from "@zk-email/helpers/src/binaryFormat";
import { generateCircuitInputs } from "@zk-email/helpers/src/input-helpers";

export const STRING_PRESELECTOR = "email was meant for @";
export const MAX_HEADER_PADDED_BYTES = 1024; // NOTE: this must be the same as the first arg in the email in main args circom
export const MAX_BODY_PADDED_BYTES = 1536; // NOTE: this must be the same as the arg to sha the remainder number of bytes in the email in main args circom

export function generateTwitterVerifierCircuitInputs({
  rsaSignature,
  rsaModulus,
  body,
  bodyHash,
  message, // the message that was signed (header + bodyHash)
  ethereumAddress,
}: {
  body: Buffer;
  message: Buffer;
  bodyHash: string;
  rsaSignature: BigInt;
  rsaModulus: BigInt;
  ethereumAddress: string;
}) {
  const emailVerifierInputs = generateCircuitInputs({
    rsaSignature,
    rsaModulus,
    body,
    bodyHash,
    message,
    shaPrecomputeSelector: STRING_PRESELECTOR,
    maxMessageLength: MAX_HEADER_PADDED_BYTES,
    maxBodyLength: MAX_BODY_PADDED_BYTES,
  });

  const bodyRemaining = emailVerifierInputs.in_body_padded.map(c => Number(c)); // Char array to Uint8Array
  const selectorBuffer = Buffer.from(STRING_PRESELECTOR);
  const usernameIndex = Buffer.from(bodyRemaining).indexOf(selectorBuffer) + selectorBuffer.length;

  const address = bytesToBigInt(fromHex(ethereumAddress)).toString();
  // const address_plus_one = (bytesToBigInt(fromHex(ethereumAddress)) + 1n).toString();

  return {
    ...emailVerifierInputs,
    twitter_username_idx: usernameIndex.toString(),
    address,
    // address_plus_one,
  };
}