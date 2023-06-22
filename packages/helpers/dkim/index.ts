import { pki } from "node-forge";
import { DkimVerifier } from "./dkim-verifier";
import { writeToStream } from "./tools";

export const dkimVerify = async (input: Buffer, options: any = {}) => {
  let dkimVerifier = new DkimVerifier(options);
  await writeToStream(dkimVerifier, input);

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
  modulus: bigint;
}

export async function verifyDKIMSignature(email: Buffer) : Promise<DKIMVerificationResult> {
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
  const modulus = BigInt(pubKeyData.n.toString());

  return {
    signature: signatureBigInt,
    message: status.signature_header,
    body, 
    bodyHash,
    modulus,
  }
}
