import { pki } from "node-forge";
import { DkimVerifier } from "../lib/mailauth/dkim-verifier";
import { writeToStream } from "../lib/mailauth/tools";
import sanitizers from "./sanitizers";

// `./mailauth` is modified version of https://github.com/postalsys/mailauth
// Main modification are including emailHeaders in the DKIM result, making it work in the browser, add types
// TODO: Fork the repo and make the changes; consider upstream to original repo

export interface DKIMVerificationResult {
  publicKey: bigint;
  signature: bigint;
  headers: Buffer;
  body: Buffer;
  bodyHash: string;
  signingDomain: string;
  selector: string;
  algo: string;
  format: string;
  modulusLength: number;
  appliedSanitization?: string;
}

/**
 *
 * @param email Entire email data as a string or buffer
 * @param domain Domain to verify DKIM signature for. If not provided, the domain is extracted from the `From` header
 * @param enableSanitization If true, email will be applied with various sanitization to try and pass DKIM verification
 * @param enableZKEmailDNSArchiver If provided, this public (modulus as bigint) key will be used instead of the one in the email
 * @returns
 */
export async function verifyDKIMSignature(
  email: Buffer | string,
  domain: string = "",
  enableSanitization: boolean = true,
  enableZKEmailDNSArchiver: bigint | null = null
): Promise<DKIMVerificationResult> {
  const emailStr = email.toString();

  let dkimResult = await tryVerifyDKIM(email, domain, enableZKEmailDNSArchiver);

  // If DKIM verification fails, try again after sanitizing email
  let appliedSanitization;
  if (dkimResult.status.comment === "bad signature" && enableSanitization) {
    const results = await Promise.all(
      sanitizers.map((sanitize) =>
        tryVerifyDKIM(sanitize(emailStr), domain).then((result) => ({
          result,
          sanitizer: sanitize.name,
        }))
      )
    );

    const passed = results.find((r) => r.result.status.result === "pass");

    if (passed) {
      console.log(
        `DKIM: Verification passed after applying sanitization "${passed.sanitizer}"`
      );
      dkimResult = passed.result;
      appliedSanitization = passed.sanitizer;
    }
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
    signature: BigInt(`0x${Buffer.from(signature, "base64").toString("hex")}`),
    headers: status.signedHeaders,
    body,
    bodyHash,
    signingDomain: dkimResult.signingDomain,
    publicKey: BigInt(pubKeyData.n.toString()),
    selector: dkimResult.selector,
    algo: dkimResult.algo,
    format: dkimResult.format,
    modulusLength: dkimResult.modulusLength,
    appliedSanitization,
  };
}

async function tryVerifyDKIM(
  email: Buffer | string,
  domain: string = "",
  enableZKEmailDNSArchiver: bigint | null = null
) {
  const dkimVerifier = new DkimVerifier({
    ...(enableZKEmailDNSArchiver && {
      resolver: async (name: string, type: string) => {
        if (type !== "TXT") {
          throw new Error(
            `ZK Email Archive only supports TXT records - got ${type}`
          );
        }
        const ZKEMAIL_DNS_ARCHIVER_API = "https://archive.prove.email/api/key";

        // Get domain from full dns record name - $selector._domainkey.$domain.com
        const domain = name.split(".").slice(-2).join(".");
        const selector = name.split(".")[0];

        const queryUrl = new URL(ZKEMAIL_DNS_ARCHIVER_API);
        queryUrl.searchParams.set("domain", domain);

        const resp = await fetch(queryUrl);
        const data = await resp.json();

        const dkimRecord = data.find(
          (record: any) => record.selector === selector
        );

        if (!dkimRecord) {
          throw new Error(
            `DKIM record not found for domain ${domain} and selector ${selector} in ZK Email Archive.`
          );
        }

        console.log("dkimRecord", dkimRecord.value);

        return [dkimRecord.value];
      },
    }),
  });

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

  dkimResult.headers = dkimVerifier.headers;

  return dkimResult;
}
