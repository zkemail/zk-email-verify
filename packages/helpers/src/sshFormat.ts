import { stringToBytes } from "./binaryFormat";
import atob from "atob";

function bytesToInt(bytes: Uint8Array) {
  return bytes[3] + 256 * (bytes[2] + 256 * (bytes[1] + 256 * bytes[0]));
}

function unpackSshBytes(bytes: Uint8Array, numStrings: number) {
  const result = [];
  let offset = 0;
  for (let i = 0; i < numStrings; ++i) {
    const lenBytes = bytes.slice(offset, offset + 4);
    // first 4 bytes is length in big endian
    const len = bytesToInt(lenBytes);
    const str = bytes.slice(offset + 4, offset + 4 + len);
    result.push(str);
    offset += 4 + len;
  }
  if (offset !== bytes.length) {
    throw new Error("Error unpacking; offset is not at end of bytes");
  }
  return result;
}

export function getRawSignature(signature: string) {
  // 0. strip out "armor" headers (lines that start with -----)
  // 1. base64 -d
  // 2. skipping first 10 bytes (for MAGIC_PREAMBLE and SIG_VERSION), unpack into 5 strings: publickey, namespace, reserved, hash_algorithm, signature
  // 3. convert public key and signature to bignum

  // #define MAGIC_PREAMBLE "SSHSIG"
  // byte[6]   MAGIC_PREAMBLE
  // string    namespace
  // string    reserved
  // string    hash_algorithm
  // string    H(payload1)

  const encodedPart = signature
    .split("\n")
    .filter((line) => !line.includes("SSH SIGNATURE"))
    .join("");
  const bytes = stringToBytes(atob(encodedPart));
  const strings = unpackSshBytes(bytes.slice(10), 5);
  const [pubKeyEncoded, namespace, , hash_algorithm, rawSignatureEncoded] = strings;

  // decrypt pub key https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshsig.c#L203-L204
  // https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshkey.c#L828-L829
  const pubKeyParts = unpackSshBytes(pubKeyEncoded, 3);
  const pubSSHKeyStr = Array.prototype.map
    .call(pubKeyEncoded, function (ch) {
      return String.fromCharCode(ch);
    })
    .join("");
  // decrypt signature https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/ssh-rsa.c#L223-L224
  const rawSigParts = unpackSshBytes(rawSignatureEncoded, 2);
  const rawSignature = rawSigParts[1];
  return {
    rawSignature,
    namespace,
    hash_algorithm,
    pubKeyEncoded,
    pubKeyParts,
    pubSSHKeyStr,
  } as const;
}

export function sshSignatureToPubKey(signature: string) {
  try {
    const encodedPart = signature
      .split("\n")
      .filter((line) => !line.includes("SSH SIGNATURE"))
      .join("");
    const bytes = stringToBytes(atob(encodedPart));
    const strings = unpackSshBytes(bytes.slice(10), 5);
    const [
      pubKeyEncoded,
      // namespace,
      // reserved,
      // hash_algorithm,
      // rawSignatureEncoded,
    ] = strings;

    const pubKeyParts = unpackSshBytes(pubKeyEncoded, 3);

    const pubSSHKeyStr: string = Array.prototype.map
      .call(pubKeyEncoded, function (ch) {
        return String.fromCharCode(ch);
      })
      .join("");
    const keytype = new TextDecoder().decode(pubKeyParts[0]);
    if (keytype !== "ssh-rsa") {
      return "ERROR GRR";
    }
    return keytype + " " + btoa(pubSSHKeyStr);
  } catch (e) {
    return "";
  }
}
