import dns from "dns";
import forge from "node-forge";
import { publicEncrypt } from 'crypto';
import {
    toCircomBigIntBytes,
  } from "../binaryFormat";
import { pki } from "node-forge";

export default async function formatDkimKey(domain: string, selector: string) {
  // Construct the DKIM record name
  let dkimRecordName = `${selector}._domainkey.${domain}`;
  console.log(dkimRecordName);
  // Lookup the DKIM record in DNS
  let records;
  try {
    records = await dns.promises.resolveTxt(dkimRecordName);
  } catch (err) {
    console.error(err);
    return;
  }

  // The DKIM record is a TXT record containing a string
  // We need to parse this string to get the public key
  let dkimRecord = records[0].join("");
  let match = dkimRecord.match(/p=([^;]+)/);
  if (!match) {
    console.error("No public key found in DKIM record");
    return;
  }

  // The public key is base64 encoded, we need to decode it
  let pubkey = match[1];
  let binaryKey = Buffer.from(pubkey, "base64").toString('base64');

  // Get match
  let matches = binaryKey.match(/.{1,64}/g);
  if (!matches) {
    console.error("No matches found");
    return;
  }
  let formattedKey = matches.join("\n");
  console.log("Key: ", formattedKey);

  // Convert to PEM format
  let pemKey = `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;

  // Parse the RSA public key
  let publicKey = forge.pki.publicKeyFromPem(pemKey);

  // Get the modulus n only
  let n = publicKey.n;
  console.log("Modulus n:", n.toString(16));

  // Convert binary to BigInt
  let bigIntKey = BigInt(publicKey.n.toString());
  console.log(bigIntKey);
  console.log(toCircomBigIntBytes(bigIntKey));
  return toCircomBigIntBytes(bigIntKey);
}

// formatDkimKey("gmail.com", "20221208");
formatDkimKey("gmail.com", "20230601");
// formatDkimKey("twitter.com", "dkim-201406");
// formatDkimKey("ethereum.org", "salesforceeth123321");
// // let pubkey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq8JxVBMLHZRj1WvIMSHApRY3DraE/EiFiR6IMAlDq9GAnrVy0tDQyBND1G8+1fy5RwssQ9DgfNe7rImwxabWfWxJ1LSmo/DzEdOHOJNQiP/nw7MdmGu+R9hEvBeGRQAmn1jkO46KIw/p2lGvmPSe3+AVD+XyaXZ4vJGTZKFUCnoctAVUyHjSDT7KnEsaiND2rVsDvyisJUAH+EyRfmHSBwfJVHAdJ9oD8cn9NjIun/EHLSIwhCxXmLJlaJeNAFtcGeD2aRGbHaS7M6aTFP+qk4f2ucRx31cyCxbu50CDVfU+d4JkIDNBFDiV+MIpaDFXIf11bGoS08oBBQiyPXgX0wIDAQAB";
// let bigIntKey = BigInt('0x' + binaryKey.toString('hex'));
// let binaryKey = Buffer.from(pubkey, 'base64');
// console.log(toCircomBigIntBytes(bigIntKey));
