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
import { shaHash } from "../../src/helpers/shaHash";
import { dkimVerify } from "../../src/helpers/dkim";
import { assert } from "console";
import * as fs from "fs";
var Cryo = require('cryo');
const pki = require("node-forge").pki;


interface ICircuitInputs {
  modulus?: string[];
  signature?: string[];
  base_message?: string[];
  in_padded?: string[];
  in_padded_n_bytes?: string[];
  in_len_padded_bytes?: string;
}

enum CircuitType {
  RSA = "rsa",
  SHA = "sha",
  TEST = "test",
  EMAIL = "email",
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

async function sha256Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): Promise<[Uint8Array, number]> {
  let length_bits = prehash_prepad_m.length * 8; // bytes to bits
  let length_in_bytes = int32toBytes(length_bits);
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(2 ** 7));
  while ((prehash_prepad_m.length * 8 + length_in_bytes.length * 8) % 512 !== 0) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int8toBytes(0));
  }
  prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, length_in_bytes);
  console.assert((prehash_prepad_m.length * 8) % 512 === 0, "Padding did not complete properly!");
  let messageLen = prehash_prepad_m.length;
  while (prehash_prepad_m.length < maxShaBytes) {
    prehash_prepad_m = mergeUInt8Arrays(prehash_prepad_m, int32toBytes(0));
  }
  console.assert(prehash_prepad_m.length === maxShaBytes, "Padding to max length did not complete properly!");

  return [prehash_prepad_m, messageLen];
}

export async function getCircuitInputs(
  rsa_signature: BigInt,
  rsa_modulus: BigInt,
  message: string | Buffer,
  circuit: CircuitType
): Promise<{
  valid: {
    validSignatureFormat?: boolean;
    validMessage?: boolean;
  };
  circuitInputs?: ICircuitInputs;
}> {
  // Derive modulus from signature
  // const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const modulusBigInt = rsa_modulus;
  const prehash_message_string = message;
  const baseMessageBigInt = AAYUSH_PREHASH_MESSAGE_INT; // bytesToBigInt(stringToBytes(message)) ||
  const postShaBigint = AAYUSH_POSTHASH_MESSAGE_PADDED_INT;
  const signatureBigInt = rsa_signature;
  const maxShaBytes = MAX_SHA_INPUT_LENGTH_PADDED_BYTES;

  // Perform conversions
  const prehashBytesUnpadded = typeof prehash_message_string == "string" ? new TextEncoder().encode(prehash_message_string) : Uint8Array.from(prehash_message_string);
  const postShaBigintUnpadded = bytesToBigInt(stringToBytes((await shaHash(prehashBytesUnpadded)).toString())) % CIRCOM_FIELD_MODULUS;
  const [messagePadded, messagePaddedLen] = await sha256Pad(prehashBytesUnpadded, maxShaBytes);

  // Compute identity revealer
  let circuitInputs;
  let modulus = toCircomBigIntBytes(modulusBigInt);
  let signature = toCircomBigIntBytes(signatureBigInt);
  let in_len_padded_bytes = messagePaddedLen.toString();
  // let in_padded_n_bytes = packBytesIntoNBytes(messagePadded, 7).map((x) => x.toString()); // Packed  into 7 byte signals
  // console.log("Padded message bytes first 16:", messagePadded.slice(0, 16));
  // console.log("in_padded_n_bytes first 16:", in_padded_n_bytes.slice(0, 16));
  let in_padded = Array.from(messagePadded).map((x) => x.toString()); // Packed into 1 byte signals
  let base_message = toCircomBigIntBytes(postShaBigintUnpadded);

  if (circuit === CircuitType.RSA) {
    circuitInputs = {
      modulus,
      signature,
      base_message,
    };
  } else if (circuit === CircuitType.EMAIL) {
    circuitInputs = {
      modulus,
      signature,
      in_padded,
      in_len_padded_bytes,
    };
  } else if (circuit === CircuitType.SHA) {
    circuitInputs = {
      in_padded,
      in_len_padded_bytes,
    };
  }
  return {
    circuitInputs,
    valid: {},
  };
}

export async function generate_inputs(email: Buffer) {
  var result;
  try {
    result = await dkimVerify(email);
    const _ = result.results[0].publicKey.toString();
    var frozen = Cryo.stringify(result);
    fs.writeFileSync(`./email_cache.json`, frozen, { flag: "w" });
  } catch (e) {
    console.log("Reading cached email instead!")
    let frozen = fs.readFileSync(`./email_cache.json`, { encoding: "utf-8" });
    result = Cryo.parse(frozen);
  }

  let sig = BigInt("0x" + Buffer.from(result.results[0].signature, "base64").toString("hex"));
  let message = result.results[0].status.signature_header;
  let circuitType = CircuitType.EMAIL;

  let pubkey = result.results[0].publicKey;
  const pubKeyData = pki.publicKeyFromPem(pubkey.toString());
  let modulus = BigInt(pubKeyData.n.toString());
  let fin_result = await getCircuitInputs(sig, modulus, message, circuitType);
  return fin_result.circuitInputs;
  // fs.writeFileSync(`./circuits/inputs/input_${circuitType}.json`, json_result, { flag: "w" });
}

async function do_generate() {
  const email = fs.readFileSync("./msg.eml");
  console.log(JSON.stringify(await generate_inputs(email)));
}

do_generate();
