import { pki } from "node-forge";
import { DkimVerifier } from "./dkim-verifier";
import { getSigningHeaderLines, parseDkimHeaders, parseHeaders, writeToStream } from "./tools";

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
  tryRevertForwarderChanges: boolean = true
): Promise<DKIMVerificationResult> {
  let dkimResult = await tryVerifyDKIM(email, domain);

  if (dkimResult.status.result !== "pass" && tryRevertForwarderChanges) {
    console.info("DKIM verification failed. Trying to verify after reverting forwarder changes...");

    const modified = await revertForwarderChanges(email.toString());
    dkimResult = await tryVerifyDKIM(modified, domain);
  }

  if (dkimResult.status.result !== "pass") {
    throw new Error(
      `DKIM signature verification failed for domain ${dkimResult.signingDomain}`
    );
  }

  return {
    signature: BigInt("0x" + Buffer.from(dkimResult.signature, "base64").toString("hex")),
    message: Buffer.from(dkimResult.signingHeaders.canonicalizedHeader, "base64"),
    body: dkimResult.body,
    bodyHash: dkimResult.bodyHash,
    signingDomain: dkimResult.signingDomain,
    publicKey: BigInt(pki.publicKeyFromPem(dkimResult.publicKey).n.toString()),
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
  };
}

async function tryVerifyDKIM(email: Buffer | string, domain: string = "") {
  let dkimVerifier = new DkimVerifier({});
  console.log(email);
  await writeToStream(dkimVerifier, email as any);
  console.log(dkimVerifier);

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
    throw new Error(`DKIM signature not found for domain ${domainToVerifyDKIM}`);
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

function getHeaderValue(email: string, header: string) {
  const headerStartIndex = email.indexOf(`${header}: `) + header.length + 2;
  const headerEndIndex = email.indexOf('\n', headerStartIndex);
  const headerValue = email.substring(headerStartIndex, headerEndIndex);

  return headerValue;
}

function setHeaderValue(email: string, header: string, value: string) {
  return email.replace(getHeaderValue(email, header), value);
}

async function revertForwarderChanges(email: string) {
  // Google sets their own Message-ID and put the original one in X-Google-Original-Message-ID when forwarding
  const googleReplacedMessageId = getHeaderValue(email, "X-Google-Original-Message-ID");
  if (googleReplacedMessageId) {
    console.info("Setting X-Google-Original-Message-ID to Message-ID header...");
    email = setHeaderValue(email, "Message-ID", googleReplacedMessageId);
  }

  return email;
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
