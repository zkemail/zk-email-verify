import { authenticate } from "mailauth";
import { pki } from "node-forge";

interface DKIMVerificationResult {
  publicKey: bigint;
  signature: bigint;
  message: Buffer;
  bodyHash: string;
  signingDomain: string;
  selector: string;
  algo: string;
  format: string;
  modulusLength: number;
}

export async function verifyDKIMSignature(
  email: string,
  domain: string = "",
  tryRevertForwarderChanges: boolean = true
): Promise<DKIMVerificationResult> {
  let dkimResult = await tryVerifyDKIM(email, domain);

  if (dkimResult.status.result !== "pass" && tryRevertForwarderChanges) {
    const modified = await revertForwarderChanges(email);
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
    bodyHash: dkimResult.bodyHash,
    signingDomain: dkimResult.signingDomain,
    publicKey: BigInt(pki.publicKeyFromPem(dkimResult.publicKey).n.toString()),
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
  };
}

async function tryVerifyDKIM(email: string, domain: string = "") {
  const authResult = await authenticate(email, {
    disableArc: true,
    disableDmarc: true,
    disableBimi: true,
  });

  const { dkim } = authResult;

  let domainToVerifyDKIM = domain;
  if (!domainToVerifyDKIM) {
    if (dkim.headerFrom.length > 1) {
      throw new Error(
        "Multiple From header in email and domain for verification not specified"
      );
    }

    domainToVerifyDKIM = dkim.headerFrom[0].split("@")[1];
  }

  const dkimResult = dkim.results.find(
    (d: any) => d.signingDomain === domainToVerifyDKIM
  );

  if (!dkimResult) {
    throw new Error(
      `DKIM signature not found for domain ${domainToVerifyDKIM}`
    );
  }

  return dkimResult;
}

function getHeaderValue(email: string, header: string) {
  const headerStartIndex = email.indexOf(`${header}: `) + header.length + 2;
  const headerEndIndex = email.indexOf("\n", headerStartIndex);
  const headerValue = email.substring(headerStartIndex, headerEndIndex);

  return headerValue;
}

function setHeaderValue(email: string, header: string, value: string) {
  return email.replace(getHeaderValue(email, header), value);
}

async function revertForwarderChanges(email: string) {
  // Google sets their own Message-ID and put the original one in X-Google-Original-Message-ID when forwarding
  const googleReplacedMessageId = getHeaderValue(
    email,
    "X-Google-Original-Message-ID"
  );
  if (googleReplacedMessageId) {
    email = setHeaderValue(email, "Message-ID", googleReplacedMessageId);
  }

  return email;
}
