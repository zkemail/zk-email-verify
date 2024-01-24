import { pki } from "node-forge";
import { DkimVerifier } from "./dkim-verifier";
import { getSigningHeaderLines, parseDkimHeaders, parseHeaders, writeToStream } from "./tools";

export const dkimVerify = async (input: Buffer, options: any = {}) => {
  let dkimVerifier = new DkimVerifier(options);
  await writeToStream(dkimVerifier, input as any);

  const result = {
    //headers: dkimVerifier.headers,
    headerFrom: dkimVerifier.headerFrom,
    envelopeFrom: dkimVerifier.envelopeFrom,
    results: dkimVerifier.results,
  };

  if (dkimVerifier.headers) {
    Object.defineProperty(result, "headers", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: dkimVerifier.headers,
    });
  }

  return result;
};

export type DKIMVerificationResult = {
  signature: bigint;
  message: Buffer;
  body: Buffer;
  bodyHash: string;
  publicKey: bigint;
}

export async function verifyDKIMSignature(email: Buffer): Promise<DKIMVerificationResult> {
  const result = await dkimVerify(email);

  if (!result.results[0]) {
    throw new Error(`No result found on dkim output ${result}`);
  }

  const { publicKey, signature, status, body, bodyHash } = result.results[0];

  if (!publicKey) {
    if (status.message) { // Has error
      throw new Error(result.results[0].status.message);
    }
    throw new Error(`No public key found on DKIM verification result`, result.results[0]);
  }

  const signatureBigInt = BigInt("0x" + Buffer.from(signature, "base64").toString("hex"));
  const pubKeyData = pki.publicKeyFromPem(publicKey.toString());

  return {
    signature: signatureBigInt,
    message: status.signature_header,
    body,
    bodyHash,
    publicKey: BigInt(pubKeyData.n.toString()),
  }
}

export type SignatureType = 'DKIM' | 'ARC' | 'AS';

export type ParsedHeaders = ReturnType<typeof parseHeaders>;

export type Parsed = ParsedHeaders['parsed'][0];

export type ParseDkimHeaders = ReturnType<typeof parseDkimHeaders>

export type SigningHeaderLines = ReturnType<typeof getSigningHeaderLines>

export interface Options {
  signatureHeaderLine: string;
  signingDomain?: string;
  selector?: string;
  algorithm?: string;
  canonicalization: string;
  bodyHash?: string;
  signTime?: string | number | Date;
  signature?: string;
  instance: string | boolean;
  bodyHashedBytes?: string;
}

// export dkim functions
export * from "./dkim-verifier";
export * from "./message-parser";
export * from "./parse-dkim-headers";
export * from "./tools";