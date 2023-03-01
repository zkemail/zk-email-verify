import {
  bytesToBigInt,
  stringToBytes,
  fromHex,
  toCircomBigIntBytes,
  packBytesIntoNBytes,
  bufferToUint8Array,
  bufferToString,
  bufferToHex,
  Uint8ArrayToString,
  Uint8ArrayToCharArray,
  assert,
  mergeUInt8Arrays,
  int64toBytes,
} from "../helpers/binaryFormat";
import {
  CIRCOM_FIELD_MODULUS,
  MAX_HEADER_PADDED_BYTES,
  MAX_BODY_PADDED_BYTES,
  STRING_PRESELECTOR,
} from "../../src/helpers/constants";
import { shaHash, partialSha, sha256Pad } from "../../src/helpers/shaHash";
import { dkimVerify } from "../../src/helpers/dkim";
import * as fs from "fs";
import path from "path";
var Cryo = require("cryo");
const pki = require("node-forge").pki;

// const email_file = "monia_email.eml"; // "./test_email.txt", "./twitter_msg.eml", kaylee_phone_number_email_twitter
const email_file = path.join(__dirname, "../github.eml");
export interface ICircuitInputs {
  modulus?: string[];
  signature?: string[];
  base_message?: string[];
  in_padded?: string[];
  in_body_padded?: string[];
  in_body_len_padded_bytes?: string;
  in_padded_n_bytes?: string[];
  in_len_padded_bytes?: string;
  in_body_hash?: string[];
  precomputed_sha?: string[];
  body_hash_idx?: string;
  addressParts?: string[];
  address?: string;
  address_plus_one?: string;
  github_username_idx?: string;
  github_body?: string[];
}

enum CircuitType {
  RSA = "rsa",
  SHA = "sha",
  TEST = "test",
  EMAIL = "email",
}

async function findSelector(
  a: Uint8Array,
  selector: number[]
): Promise<number> {
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

export async function getCircuitInputs(
  rsa_signature: BigInt,
  rsa_modulus: BigInt,
  message: Buffer,
  body: Buffer,
  body_hash: string,
  eth_address: string,
  circuit: CircuitType
): Promise<{
  valid: {
    validSignatureFormat?: boolean;
    validMessage?: boolean;
  };
  circuitInputs: ICircuitInputs;
}> {
  console.log("Starting processing of inputs");
  // Derive modulus from signature
  // const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const modulusBigInt = rsa_modulus;
  // Message is the email header with the body hash
  const prehash_message_string = message;
  // const baseMessageBigInt = AAYUSH_PREHASH_MESSAGE_INT; // bytesToBigInt(stringToBytes(message)) ||
  // const postShaBigint = AAYUSH_POSTHASH_MESSAGE_PADDED_INT;
  const signatureBigInt = rsa_signature;

  // Perform conversions
  const prehashBytesUnpadded =
    typeof prehash_message_string == "string"
      ? new TextEncoder().encode(prehash_message_string)
      : Uint8Array.from(prehash_message_string);
  const postShaBigintUnpadded =
    bytesToBigInt(
      stringToBytes((await shaHash(prehashBytesUnpadded)).toString())
    ) % CIRCOM_FIELD_MODULUS;
  console.log("prehash: ", prehashBytesUnpadded);
  console.log("len prehash: ", prehashBytesUnpadded.length);
  console.log("maxheaderpad: ", MAX_HEADER_PADDED_BYTES);
  // Sha add padding
  const [messagePadded, messagePaddedLen] = await sha256Pad(
    prehashBytesUnpadded,
    MAX_HEADER_PADDED_BYTES
  );
  console.log("body length", body.length);
  // Why 63, 65, 64
  const calc_length = Math.floor((body.length + 63 + 65) / 64) * 64; // 65 comes from the 64 at the end and the 1 bit in the start, then rounded up to the nearest 64
  console.log("calc_length ", calc_length);
  const [bodyPadded, bodyPaddedLen] = await sha256Pad(
    body,
    Math.max(MAX_BODY_PADDED_BYTES, calc_length)
  );
  console.log("bodypaddedlen", bodyPaddedLen);

  // Ensure SHA manual unpadded is running the correct function
  const shaOut = await partialSha(messagePadded, messagePaddedLen);
  assert(
    (await Uint8ArrayToString(shaOut)) ===
      (await Uint8ArrayToString(
        Uint8Array.from(await shaHash(prehashBytesUnpadded))
      )),
    "SHA256 calculation did not match!"
  );

  // Precompute SHA prefix
  const selector = STRING_PRESELECTOR["github"]
    .split("")
    .map((char) => char.charCodeAt(0));
  const selector_loc = await findSelector(bodyPadded, selector);
  console.log("Body selector found at: ", selector_loc);
  let shaCutoffIndex =
    Math.floor((await findSelector(bodyPadded, selector)) / 64) * 64;
  const precomputeText = bodyPadded.slice(0, shaCutoffIndex);
  let bodyRemaining = bodyPadded.slice(shaCutoffIndex);
  const bodyRemainingLen = bodyPaddedLen - precomputeText.length;
  console.log("bodyremain: ", bodyRemainingLen);
  console.log("Max body padded", MAX_BODY_PADDED_BYTES);
  assert(bodyRemainingLen < MAX_BODY_PADDED_BYTES, "Invalid slice");
  assert(
    bodyRemaining.length % 64 === 0,
    "Not going to be padded correctly with int64s"
  );
  console.log("bodyremain: ", bodyRemainingLen);
  console.log("Max body padded", MAX_BODY_PADDED_BYTES);
  while (bodyRemaining.length < MAX_BODY_PADDED_BYTES) {
    // console.log("be4", bodyRemaining.length);
    bodyRemaining = mergeUInt8Arrays(bodyRemaining, int64toBytes(0));
    // console.log("after", bodyRemaining.length);
  }
  console.log("jer");
  assert(bodyRemaining.length === MAX_BODY_PADDED_BYTES, "Invalid slice");
  const bodyShaPrecompute = await partialSha(precomputeText, shaCutoffIndex);

  // Compute identity revealer
  let circuitInputs;
  const modulus = toCircomBigIntBytes(modulusBigInt);
  const signature = toCircomBigIntBytes(signatureBigInt);

  const in_len_padded_bytes = messagePaddedLen.toString();
  const in_padded = await Uint8ArrayToCharArray(messagePadded); // Packed into 1 byte signals
  const in_body_len_padded_bytes = bodyRemainingLen.toString();
  const in_body_padded = await Uint8ArrayToCharArray(bodyRemaining);
  var github_body: Array<string> = [];
  const base_message = toCircomBigIntBytes(postShaBigintUnpadded);
  const precomputed_sha = await Uint8ArrayToCharArray(bodyShaPrecompute);
  const body_hash_idx = bufferToString(message).indexOf(body_hash).toString();

  const address = bytesToBigInt(fromHex(eth_address)).toString();
  const address_plus_one = (
    bytesToBigInt(fromHex(eth_address)) + 1n
  ).toString();

  const USERNAME_SELECTOR = Buffer.from(STRING_PRESELECTOR["github"]);
  // optimized version --> 5 : index of > from "<span>&lt;"
  const github_username_idx = (
    Buffer.from(bodyRemaining).indexOf(USERNAME_SELECTOR) + 5
  ).toString();
  console.log(
    "Github Username (start for github_regex) idx: ",
    github_username_idx
  );
  for (let i = 0; i < 64; i++) {
    github_body.push(in_body_padded[i + parseInt(github_username_idx)]);
    console.log("body", in_body_padded[i + parseInt(github_username_idx)]);
  }
  if (circuit === CircuitType.RSA) {
    circuitInputs = {
      modulus,
      signature,
      base_message,
    };
  } else if (circuit === CircuitType.EMAIL) {
    circuitInputs = {
      in_padded,
      modulus,
      signature,
      in_len_padded_bytes,
      precomputed_sha,
      in_body_padded,
      in_body_len_padded_bytes,
      github_username_idx,
      github_body,
      address,
      address_plus_one,
      body_hash_idx,
    };
  } else {
    assert(circuit === CircuitType.SHA, "Invalid circuit type");
    circuitInputs = {
      in_padded,
      in_len_padded_bytes,
      precomputed_sha,
    };
  }
  return {
    circuitInputs,
    valid: {},
  };
}

export async function generate_inputs(
  email: Buffer,
  eth_address: string
): Promise<ICircuitInputs> {
  var result;
  // try {
  // debugger;
  console.log("DKIM verification starting");
  result = await dkimVerify(email);
  if (!result.results[0].publicKey) {
    if (result.results[0].status.message) {
      throw new Error(result.results[0].status.message);
    } else {
      throw new Error("No public key found on generate_inputs");
    }
  }
  const _ = result.results[0].publicKey.toString();
  console.log("DKIM verification successful");
  // var frozen = Cryo.stringify(result);
  // fs.writeFileSync(`./email_cache.json`, frozen, { flag: "w" });
  // } catch (e) {
  //   console.log("Reading cached email instead!")
  //   let frozen = fs.readFileSync(`./email_cache.json`, { encoding: "utf-8" });
  //   result = Cryo.parse(frozen);
  // }
  let sig = BigInt(
    "0x" + Buffer.from(result.results[0].signature, "base64").toString("hex")
  );
  let message = result.results[0].status.signature_header;
  let body = result.results[0].body;
  let body_hash = result.results[0].bodyHash;
  let circuitType = CircuitType.EMAIL;

  let pubkey = result.results[0].publicKey;
  const pubKeyData = pki.publicKeyFromPem(pubkey.toString());
  let modulus = BigInt(pubKeyData.n.toString());
  let fin_result = await getCircuitInputs(
    sig,
    modulus,
    message,
    body,
    body_hash,
    eth_address,
    circuitType
  );
  return fin_result.circuitInputs;
}

async function do_generate() {
  const email = fs.readFileSync(email_file);
  console.log(email);
  const gen_inputs = await generate_inputs(
    email,
    "0x0000000000000000000000000000000000000000"
  );
  // console.log(JSON.stringify(gen_inputs));
  return gen_inputs;
}

async function gen_test() {
  console.log(
    packBytesIntoNBytes(
      Uint8Array.from([
        0, 121, 117, 115, 104, 95, 103, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0,
      ])
    )
  );
}

export async function insert13Before10(a: Uint8Array): Promise<Uint8Array> {
  let ret = new Uint8Array(a.length + 1000);
  let j = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 10) {
      ret[j] = 13;
      j++;
    }
    ret[j] = a[i];
    j++;
  }
  return ret.slice(0, j);
}

async function debug_file() {
  const email = fs.readFileSync(email_file);
  console.log(Uint8Array.from(email));
  // Key difference: file load has 13 10, web version has just 10
}

// If main
if (typeof require !== "undefined" && require.main === module) {
  // debug_file();
  const circuitInputs = do_generate();
  console.log("Writing to file...");
  circuitInputs.then((inputs) =>
    fs.writeFileSync(
      path.join(__dirname, `../../circuits/inputs/input_github.json`),
      JSON.stringify(inputs),
      { flag: "w" }
    )
  );
  // gen_test();
}
