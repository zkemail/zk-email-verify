import { bytesToBigInt, stringToBytes, toCircomBigIntBytes } from "../../src/helpers/binaryFormat";
import {
  AAYUSH_EMAIL_SIG,
  AAYUSH_EMAIL_MODULUS,
  AAYUSH_POSTHASH_MESSAGE_PADDED_INT,
  AAYUSH_PREHASH_MESSAGE_INT,
  AAYUSH_PREHASH_MESSAGE_STRING,
  CIRCOM_FIELD_MODULUS,
  MAX_SHA_INPUT_LENGTH_PADDED_BYTES,
} from "../../src/helpers/constants";
// import { initializePoseidon, poseidon, poseidonK } from "../poseidonHash";
import { verifyRSA } from "../../src/helpers/rsa";
import { shaHash } from "../../src/helpers/shaHash";
import { getRawSignature, sshSignatureToPubKey } from "../../src/helpers/sshFormat";
// const fs = require("fs");
// import { Buffer } from "node";
import fs from "fs";
// import { IGroupMessage, IGroupSignature, IIdentityRevealer } from "./types";
// @ts-ignore
// import * as snarkjs from "snarkjs";
// import localforage from "localforage";
// import { resolveGroupIdentifierTree } from "./resolveGroupIdentifier";
// import { getMerkleProof } from "../merkle";

interface ICircuitInputs {
  modulus: string[];
  signature: string[];
  base_message?: string[];
  in?: string[];
  in_len_padded_bytes?: string;
}

enum CircuitType {
  RSA = "rsa",
  SHA = "sha",
  TEST = "test",
}

// Works only on 32 bit sha text lengths
function int32toBytes(num: number): Uint8Array {
  let arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
  let view = new DataView(arr);
  view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

// Works only on 32 bit sha text lengths
function int8toBytes(num: number): Uint8Array {
  let arr = new ArrayBuffer(1); // an Int8 takes 4 bytes
  let view = new DataView(arr);
  view.setUint8(0, num); // byteOffset = 0; litteEndian = false
  return new Uint8Array(arr);
}

function mergeUInt8Arrays(a1: Uint8Array, a2: Uint8Array): Uint8Array {
  // sum of individual array lengths
  var mergedArray = new Uint8Array(a1.length + a2.length);
  mergedArray.set(a1);
  mergedArray.set(a2, a1.length);
  return mergedArray;
}

async function sha256Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): Promise<Uint8Array> {
  let length_bits = prehash_prepad_m.length * 8; // bytes to bits
  let length_in_bytes = int32toBytes(length_bits);
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7));
  while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
  }
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
  console.assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");

  while (prehash_prepad_m.length < maxShaBytes) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int32toBytes(0));
  }
  console.assert(prehash_prepad_m.length === maxShaBytes, "Padding to max length did not complete properly!");

  return prehash_prepad_m;
}

export async function getCircuitInputs(
  sshSignature: string,
  message: string,
  circuit: CircuitType
): Promise<{
  valid: {
    validSignatureFormat?: boolean;
    validMessage?: boolean;
  };
  circuitInputs?: ICircuitInputs;
}> {
  let validSignatureFormat = true;
  let rawSignature: any, pubKeyParts: any;
  // Make sure signature is valid
  try {
    const rawSig = getRawSignature(sshSignature);
    rawSignature = rawSig.rawSignature;
    pubKeyParts = rawSig.pubKeyParts;
  } catch (e) {
    console.error(e);
    return {
      valid: {
        validSignatureFormat: false,
      },
    };
  }

  // Derive modulus from signature
  // const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const modulusBigInt = AAYUSH_EMAIL_MODULUS;
  const prehash_message_string = Buffer.from(AAYUSH_PREHASH_MESSAGE_STRING, "utf-8").toString(); //utf-8 string
  const baseMessageBigInt = AAYUSH_PREHASH_MESSAGE_INT; // bytesToBigInt(stringToBytes(message)) ||
  const postShaBigint = AAYUSH_POSTHASH_MESSAGE_PADDED_INT;
  const signatureBigInt = AAYUSH_EMAIL_SIG;
  const maxShaBytes = MAX_SHA_INPUT_LENGTH_PADDED_BYTES;

  // Perform conversions
  const prehashBytesUnpadded = stringToBytes(prehash_message_string);
  const postShaBigintUnpadded = bytesToBigInt(stringToBytes(await shaHash(prehash_message_string))) % CIRCOM_FIELD_MODULUS;
  const messageBigInt = verifyRSA(signatureBigInt, modulusBigInt);
  const validMessage =
    messageBigInt === postShaBigint &&
    toCircomBigIntBytes(messageBigInt)[0] === toCircomBigIntBytes(postShaBigintUnpadded)[0] &&
    toCircomBigIntBytes(messageBigInt)[1] === toCircomBigIntBytes(postShaBigintUnpadded)[1];
  const messagePadded = await sha256Pad(prehashBytesUnpadded, maxShaBytes);

  console.log(messageBigInt, postShaBigint);
  // Compute identity revealer
  let pubKey = sshSignatureToPubKey(sshSignature);
  console.log("pubKey", pubKey);
  let circuitInputs;
  if (circuit === CircuitType.RSA) {
    circuitInputs = {
      modulus: toCircomBigIntBytes(modulusBigInt),
      signature: toCircomBigIntBytes(AAYUSH_EMAIL_SIG),
      base_message: toCircomBigIntBytes(postShaBigintUnpadded),
    };
  } else if (circuit === CircuitType.SHA) {
    circuitInputs = {
      modulus: toCircomBigIntBytes(modulusBigInt),
      signature: toCircomBigIntBytes(AAYUSH_EMAIL_SIG),
      in: Array.from(messagePadded).map((x) => x.toString()),
      in_len_padded_bytes: messagePadded.length.toString(),
    };
  }
  return {
    circuitInputs,
    valid: {
      validSignatureFormat: true,
      validMessage,
    },
  };
}

let sig =
  "U1NIU0lHAAAAAQAAAhcAAAAHc3NoLXJzYQAAAAMBAAEAAAIBANXqk6XbP7S1sQ/SVTjrgdq9k4cirXdq7oo2AfL9kmO1PeIsapPJQWRMBKO/LJl1UC+X/m/lTfNEfQ+VNv7vWNiPMcC1veLfaV52HcW75OSnmT0Anaq1MrB9RYuzgW5/1dPhfMWDg9NblW6IyeQ9i3fuDUQLrbShWir4IYXdVZixUUtrUD3ArUC/LTtHtFmmfCj3P9CN5Qi1/vvRVLdHuHhOdIEbkFnSUlmv8fhSXclFHFvY3Ivm0NS9wPDmY9yKfQn9XBoj+UiNL43mSMCos6B6RpX0ryRhZYXS49xyJQ0qT53ooaB9tOF64zNKttfupqSWfoqQEjsNyMuS7XPFGxwqz0W30CP+HBpcZFG93x6nirpRi+LxpTr3GCrI7wymZrlW4PM0WCJo2nhWCKlUWZRoWCBSQf2AwhFXHlm+9Wu479GBOsE5VSr3bAK8o6iHm0aMMeeJsCsW6vrw3CNf3n59gfL+lSeWM9Iuxbdm1p3n1ak2yesU1Tjx4bgwBwZrbuUFBgAoajykkcYoMD5yd/ZeUCiikuwzofw5hs8ULJheTVBhczwQARDT/igSLAW4VwJZh2f2hdb2ZKLJ58ybR7Abhk5ktJlNmPdiaCSYKrs+v6rCCCEuQp1cKXnqbfDo37hM7r1aEuMy7mm69eiIMR6t2U9yzCdC/tvj/8EGZfpTAAAABGZpbGUAAAAAAAAABnNoYTUxMgAAAhQAAAAMcnNhLXNoYTItNTEyAAACAMy9ltURbhVEJe/H+6iyPji5DgeWN9Rg8rYOkGiJAeA7URJP9GEdltLg6DjCLrxE9jZaY5xJ1ZgG0Oav2U0yG9yXYAM8mBQTnLSjrO9R/0wlldTOB/RLjK83qd12b9UWK+zfIFqHfR2kd2sTWYU/J5O+s+kYXwiE/HyhtHKszaCsLd/9PGzcWbOHDwLB6psLSQCoIc0ZIG3/+ltfN+5aqIb9ZxxQybP2eEz33OSVhPs5RXkrjUHIsierVICrhNy6nmUjjXNhIkngT1rgzFiaEnlqYHSL6P3TQM72gSnSaRSgdUNh/1sXO0HOQDLW4AtLnAyy4EkmzEexW7InD0LiKaJ/04dkT08ONVq3QkRlnfDyRlNd/mmpKhMw2CyhtqocZmlpWZlDL4teOkPUdcDIupEeklRYD2I6y8zh4msS85N9yCa2wUJDPnO5KKrfLIy9AujU+MRO5RpPUBhG5iKe9iIpDvXf58AjKWtiXjOs0jVKLTBaHHzLI5JfH36xs5dceq4egptLEMpqujonDFsvfVFCYHeG27xIpvDGrknd3pk+IkJEZv8sBbBv2rllGW33piTPNZPkTQU6rzHuINALiCtqr5LAgyt7xMAJ8gCijxmALb5aAspp32yBWFP0dRcLINnMc9Y7I1rPMd/0t+eVsQ/a4KBUEwu3RzkOrpZdu3rQ";
let message =
  'MIME-Version: 1.0\nDate: Wed, 20 Jul 2022 20:57:29 -0400\nMessage-ID: <CA+OJ5QcyuBn=q4G_8gN2pxC8XDTSjDR9B6oxR4XLxWhAz4tWRA@mail.gmail.com>\nSubject: are we on chain yet ii\nFrom: Aayush Gupta <aayushg@mit.edu>\nTo: sampritipanda@outlook.com\nContent-Type: multipart/alternative; boundary="000000000000ac7b4205e446334f"\n\n--000000000000ac7b4205e446334f\nContent-Type: text/plain; charset="UTF-8"\n\ni am sending an authenticated email from mit.edus servers\n\n--000000000000ac7b4205e446334f\nContent-Type: text/html; charset="UTF-8"\n\n<div dir="auto">i am sending an authenticated email from mit.edus servers</div>\n--000000000000ac7b4205e446334f--';
let circuitType = CircuitType.SHA;

getCircuitInputs(sig, message, circuitType).then((result) => {
  let json_result = JSON.stringify(result.circuitInputs);
  console.log(json_result);
  fs.writeFileSync("./circuits/inputs/input_test.json", json_result);
});
