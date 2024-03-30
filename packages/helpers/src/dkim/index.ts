import { pki } from "node-forge";
import { DkimVerifier } from "./dkim-verifier";
import {
  getSigningHeaderLines,
  parseDkimHeaders,
  parseHeaders,
  writeToStream,
} from "./tools";
import { revertCommonARCModifications } from "./arc";

export interface DKIMVerificationResult {
  publicKey: bigint;
  signature: bigint;
  message: Buffer;
  body: Buffer;
  bodyHash: string;
  signingDomain: string;
  selector: string;
  algo: string;
  format: string;
  modulusLength: number;
}

export async function verifyDKIMSignature(
  email: Buffer | string,
  domain: string = "",
  tryRevertARCChanges: boolean = true
): Promise<DKIMVerificationResult> {

  const emailStr = email.toString();

  const pgpMarkers = [
    "BEGIN PGP MESSAGE",
    "BEGIN PGP SIGNED MESSAGE",
  ];

  const isPGPEncoded = pgpMarkers.some(marker => emailStr.includes(marker));

  if (isPGPEncoded) {
    throw new Error("PGP encoded emails are not supported.");
  }

  let dkimResult = await tryVerifyDKIM(email, domain);

  // If DKIM verification fails, revert common modifications made by ARC and try again.
  if (dkimResult.status.comment === "bad signature" && tryRevertARCChanges) {
    const modified = await revertCommonARCModifications(email.toString());
    dkimResult = await tryVerifyDKIM(modified, domain);
  }

  const {
    status: { result, comment },
    signingDomain,
    publicKey,
    signature,
    status,
    body,
    bodyHash,
  } = dkimResult;

  if (result !== "pass") {
    throw new Error(
      `DKIM signature verification failed for domain ${signingDomain}. Reason: ${comment}`
    );
  }

  const pubKeyData = pki.publicKeyFromPem(publicKey.toString());

  return {
    signature: BigInt("0x" + Buffer.from(signature, "base64").toString("hex")),
    message: status.signature_header,
    body: body,
    bodyHash: bodyHash,
    signingDomain: dkimResult.signingDomain,
    publicKey: BigInt(pubKeyData.n.toString()),
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
  };
}

async function tryVerifyDKIM(email: Buffer | string, domain: string = "") {
  let dkimVerifier = new DkimVerifier({});
  await writeToStream(dkimVerifier, email as any);

  let domainToVerifyDKIM = domain;
  if (!domainToVerifyDKIM) {
    if (dkimVerifier.headerFrom.length > 1) {
      throw new Error(
        "Multiple From header in email and domain for verification not specified"
      );
    }

    domainToVerifyDKIM = dkimVerifier.headerFrom[0].split("@")[1];
  }

  const dkimResult = dkimVerifier.results.find(
    (d: any) => d.signingDomain === domainToVerifyDKIM
  );

  if (!dkimResult) {
    throw new Error(
      `DKIM signature not found for domain ${domainToVerifyDKIM}`
    );
  }

  if (dkimVerifier.headers) {
    Object.defineProperty(dkimResult, "headers", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: dkimVerifier.headers,
    });
  }

  return dkimResult;
}

export type SignatureType = "DKIM" | "ARC" | "AS";

export type ParsedHeaders = ReturnType<typeof parseHeaders>;

export type Parsed = ParsedHeaders["parsed"][0];

export type ParseDkimHeaders = ReturnType<typeof parseDkimHeaders>;

export type SigningHeaderLines = ReturnType<typeof getSigningHeaderLines>;

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
