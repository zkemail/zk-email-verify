import { bytesToBigInt, stringToBytes, toCircomBigIntBytes } from "../../src/helpers/binaryFormat";
import {
  AAYUSH_EMAIL_SIG,
  AAYUSH_EMAIL_MODULUS,
  AAYUSH_POSTHASH_MESSAGE_PADDED_INT,
  AAYUSH_PREHASH_MESSAGE_INT,
  AAYUSH_PREHASH_MESSAGE_STRING,
  CIRCOM_FIELD_MODULUS,
  MAX_HEADER_PADDED_BYTES,
  MAX_BODY_PADDED_BYTES,
  STRING_PRESELECTOR
} from "../../src/helpers/constants";
import { shaHash } from "../../src/helpers/shaHash";
import { dkimVerify } from "../../src/helpers/dkim";
import { assert } from "console";
import { Hash } from "./fast-sha256"
import * as fs from "fs";
var Cryo = require('cryo');
const pki = require("node-forge").pki;

interface ICircuitInputs {
  modulus?: string[];
  signature?: string[];
  base_message?: string[];
  in_padded?: string[];
  in_body_padded?: string[];
  in_body_len_padded_bytes?: string[];
  in_padded_n_bytes?: string[];
  in_len_padded_bytes?: string[];
  in_body_hash?: string[];
  precomputed_sha?: string[];
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

// Puts an end selector, a bunch of 0s, then the length, then fill the rest with 0s.
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

async function Uint8ArrayToCharArray(a: Uint8Array): Promise<string[]> {
  return Array.from(a).map((x) => x.toString());
}

async function Uint8ArrayToString(a: Uint8Array): Promise<string> {
  return Array.from(a).map((x) => x.toString()).join(";");
}

async function findSelector(a: Uint8Array, selector: number[]): Promise<number> {
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (a[i] === selector[j]) {
      j++;
      if (j === selector.length) {
        return i - j + 1;
      }
    } else {
      j = 0;
    }
    i++;
  }
  return -1;
}

async function partialSha(msg:Uint8Array, msgLen: number): Promise<Uint8Array> {
  const shaGadget = new Hash();
  return await shaGadget.update(msg, msgLen).cacheState()
}

export async function getCircuitInputs(
  rsa_signature: BigInt,
  rsa_modulus: BigInt,
  message: Buffer,
  body: Buffer,
  body_hash: string,
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

  // Perform conversions
  const prehashBytesUnpadded = typeof prehash_message_string == "string" ? new TextEncoder().encode(prehash_message_string) : Uint8Array.from(prehash_message_string);
  const postShaBigintUnpadded = bytesToBigInt(stringToBytes((await shaHash(prehashBytesUnpadded)).toString())) % CIRCOM_FIELD_MODULUS;

  // Sha add padding
  const [messagePadded, messagePaddedLen] = await sha256Pad(prehashBytesUnpadded, MAX_HEADER_PADDED_BYTES);
  const [bodyPadded, bodyPaddedLen] = await sha256Pad(body, MAX_BODY_PADDED_BYTES);

  // Precompute SHA prefix
  const selector = STRING_PRESELECTOR.split('').map(char => char.charCodeAt(0))
  console.log(await findSelector(bodyPadded, selector));
  let shaCutoffIndex = Math.floor(((await findSelector(bodyPadded, selector)) / 512)) * 512;
  const precomputeText = bodyPadded.slice(0, shaCutoffIndex);
  const bodyShaPrecompute = bytesToBigInt(stringToBytes((await partialSha(precomputeText, shaCutoffIndex)).toString())) % CIRCOM_FIELD_MODULUS;
  console.log(bodyShaPrecompute);

  // Ensure SHA manual unpadded is running the correct function
  const shaOut = await partialSha(messagePadded, messagePaddedLen);
  assert(await Uint8ArrayToString(shaOut) === await Uint8ArrayToString(Uint8Array.from(await shaHash(prehashBytesUnpadded))), "SHA256 calculation did not match!");

  // Compute identity revealer
  let circuitInputs;
  const modulus = toCircomBigIntBytes(modulusBigInt);
  const signature = toCircomBigIntBytes(signatureBigInt);
  const in_len_padded_bytes = await Uint8ArrayToCharArray(stringToBytes(messagePaddedLen.toString()));
  const in_padded = await Uint8ArrayToCharArray(messagePadded); // Packed into 1 byte signals
  const in_body_len_padded_bytes = await Uint8ArrayToCharArray(stringToBytes(bodyPaddedLen.toString()));
  const in_body_padded = await Uint8ArrayToCharArray(bodyPadded);
  const in_body_hash = await Uint8ArrayToCharArray(Buffer.from(body_hash));
  const base_message = toCircomBigIntBytes(postShaBigintUnpadded);
  const precomputed_sha = toCircomBigIntBytes(bodyShaPrecompute);

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
      in_body_padded,
      in_body_len_padded_bytes,
      in_body_hash,
      precomputed_sha
    };
  } else if (circuit === CircuitType.SHA) {
    circuitInputs = {
      in_padded,
      in_len_padded_bytes,
      precomputed_sha
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
  let body = result.results[0].body;
  let body_hash = result.results[0].bodyHash;
  let circuitType = CircuitType.EMAIL;

  let pubkey = result.results[0].publicKey;
  const pubKeyData = pki.publicKeyFromPem(pubkey.toString());
  let modulus = BigInt(pubKeyData.n.toString());
  let fin_result = await getCircuitInputs(sig, modulus, message, body, body_hash, circuitType);
  fs.writeFileSync(`./circuits/inputs/input_twitter.json`, JSON.stringify(fin_result.circuitInputs), { flag: "w" });
  return fin_result.circuitInputs;
}

async function do_generate() {
  const email = fs.readFileSync("./twitter_msg.eml");
  console.log(JSON.stringify(await generate_inputs(email)));
}

do_generate();
