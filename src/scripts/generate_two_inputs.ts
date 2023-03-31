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
  import { CIRCOM_FIELD_MODULUS, MAX_HEADER_PADDED_BYTES, MAX_BODY_PADDED_BYTES, STRING_PRESELECTOR, STRING_PRESELECTOR_AIRBNB, STRING_PRESELECTOR_COINBASE } from "../../src/helpers/constants";
  import { shaHash, partialSha, sha256Pad } from "../../src/helpers/shaHash";
  import { dkimVerify } from "../../src/helpers/dkim";
  import * as fs from "fs";
  var Cryo = require("cryo");
  const pki = require("node-forge").pki;
  
  // const email_file = "monia_email.eml"; // "./test_email.txt", "./twitter_msg.eml", kaylee_phone_number_email_twitter
  const email_file_airbnb = "./nathan_airbnb_email.eml";
  const email_file_coinbase = "./nathan_coinbase_email.eml";
  const email_file_default = "./nathan_twitter_email.eml";
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
    email_from_idx?: string;
    email_to_idx?: string;
  }
  
  enum CircuitType {
    RSA = "rsa",
    SHA = "sha",
    TEST = "test",
    EMAIL = "email",
  }

  enum KYCType {
    AIRBNB = "airbnb",
    COINBASE = "coinbase",
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
  
  export async function getCircuitInputs(
    rsa_signature: BigInt,
    rsa_modulus: BigInt,
    message: Buffer,
    body: Buffer,
    body_hash: string,
    eth_address: string,
    circuitType: CircuitType,
    kycType: KYCType
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
    const prehashBytesUnpadded = typeof prehash_message_string == "string" ? new TextEncoder().encode(prehash_message_string) : Uint8Array.from(prehash_message_string);
    const postShaBigintUnpadded = bytesToBigInt(stringToBytes((await shaHash(prehashBytesUnpadded)).toString())) % CIRCOM_FIELD_MODULUS;
  
    // Sha add padding
    // 65 comes from the 64 at the end and the 1 bit in the start, then 63 comes from the formula to round it up to the nearest 64. see sha256algorithm.com for a more full explanation of paddnig length
    const calc_length = Math.floor((body.length + 63 + 65) / 64) * 64;
    const [messagePadded, messagePaddedLen] = await sha256Pad(prehashBytesUnpadded, MAX_HEADER_PADDED_BYTES);
    const [bodyPadded, bodyPaddedLen] = await sha256Pad(body, Math.max(MAX_BODY_PADDED_BYTES, calc_length));
  
    // Ensure SHA manual unpadded is running the correct function
    const shaOut = await partialSha(messagePadded, messagePaddedLen);
    assert((await Uint8ArrayToString(shaOut)) === (await Uint8ArrayToString(Uint8Array.from(await shaHash(prehashBytesUnpadded)))), "SHA256 calculation did not match!");
  
    // Precompute SHA prefix
    let selector;
    if (kycType === KYCType.AIRBNB) {
      selector = STRING_PRESELECTOR_AIRBNB.split("").map((char) => char.charCodeAt(0));
    } else if (kycType === KYCType.COINBASE) {
      selector = STRING_PRESELECTOR_COINBASE.split("").map((char) => char.charCodeAt(0));
    } else {
      // this line is dumb as should never happen :/
      selector = STRING_PRESELECTOR.split("").map((char) => char.charCodeAt(0));
    }
    const selector_loc = await findSelector(bodyPadded, selector);
    console.log("Body selector found at: ", selector_loc);
    let shaCutoffIndex = Math.floor((await findSelector(bodyPadded, selector)) / 64) * 64;
    const precomputeText = bodyPadded.slice(0, shaCutoffIndex);
    let bodyRemaining = bodyPadded.slice(shaCutoffIndex);
    const bodyRemainingLen = bodyPaddedLen - precomputeText.length;
    assert(bodyRemainingLen < MAX_BODY_PADDED_BYTES, "Invalid slice");
    assert(bodyRemaining.length % 64 === 0, "Not going to be padded correctly with int64s");
    while (bodyRemaining.length < MAX_BODY_PADDED_BYTES) {
      bodyRemaining = mergeUInt8Arrays(bodyRemaining, int64toBytes(0));
    }
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
    const base_message = toCircomBigIntBytes(postShaBigintUnpadded);
    const precomputed_sha = await Uint8ArrayToCharArray(bodyShaPrecompute);
    const body_hash_idx = bufferToString(message).indexOf(body_hash).toString();
  
    const address = bytesToBigInt(fromHex(eth_address)).toString();
    const address_plus_one = (bytesToBigInt(fromHex(eth_address)) + 1n).toString();
  
    const email_from_idx = Buffer.from(prehash_message_string).indexOf("from:").toString();
    const email_to_idx = Buffer.from(prehash_message_string).indexOf("to:").toString();
  
    if (circuitType === CircuitType.RSA) {
      circuitInputs = {
        modulus,
        signature,
        base_message,
      };
    } else if (circuitType === CircuitType.EMAIL) {
      circuitInputs = {
        in_padded,
        modulus,
        signature,
        in_len_padded_bytes,
        // precomputed_sha,
        // in_body_padded,
        // in_body_len_padded_bytes,
        address,
        address_plus_one,
        body_hash_idx,
        // email_from_idx,
        email_to_idx,
      };
    } else {
      assert(circuitType === CircuitType.SHA, "Invalid circuit type");
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
  
  export async function generate_inputs(email: Buffer, eth_address: string, kycType: KYCType): Promise<ICircuitInputs> {
    var result;
    console.log("DKIM verification starting");
    result = await dkimVerify(email);
    if (!result.results[0]) {
      throw new Error(`No result found on dkim output ${result}`);
    } else {
      if (!result.results[0].publicKey) {
        if (result.results[0].status.message) {
          throw new Error(result.results[0].status.message);
        } else {
          throw new Error(`No public key found on generate_inputs result ${JSON.stringify(result)}`);
        }
      }
    }
    const _ = result.results[0].publicKey.toString();
    console.log("DKIM verification successful");
    // try {
    //   // TODO: Condiiton code on if there is an internet connection, run this code
    //   var frozen = Cryo.stringify(result);
    //   fs.writeFileSync(`./email_cache_2.json`, frozen, { flag: "w" });
    // } catch (e) {i
    //   console.log("Reading cached email instead!");
    //   let frozen = fs.readFileSync(`./email_cache.json`, { encoding: "utf-8" });
    //   result = Cryo.parse(frozen);
    // }
    let sig = BigInt("0x" + Buffer.from(result.results[0].signature, "base64").toString("hex"));
    let message = result.results[0].status.signature_header;
    let body = result.results[0].body;
    let body_hash = result.results[0].bodyHash;
    let circuitType = CircuitType.EMAIL;
  
    let pubkey = result.results[0].publicKey;
    const pubKeyData = pki.publicKeyFromPem(pubkey.toString());
    let modulus = BigInt(pubKeyData.n.toString());
    let fin_result = await getCircuitInputs(sig, modulus, message, body, body_hash, eth_address, circuitType, kycType);
    return fin_result.circuitInputs;
  }
  
  async function do_generate(kycType: KYCType) {
    let email;
    if (kycType === KYCType.AIRBNB) {
      email = fs.readFileSync(email_file_airbnb);
    } else if (kycType === KYCType.COINBASE) {
      email = fs.readFileSync(email_file_coinbase);
    } else {
      email = fs.readFileSync(email_file_default);
    }
    console.log(email);
    const gen_inputs = await generate_inputs(email, "0x0000000000000000000000000000000000000000", kycType);
    // console.log(JSON.stringify(gen_inputs_airbnb));
    return gen_inputs;
  }
  
  async function gen_test() {
    console.log(packBytesIntoNBytes(Uint8Array.from([0, 121, 117, 115, 104, 95, 103, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])));
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
    const email_airbnb = fs.readFileSync(email_file_airbnb);
    console.log(Uint8Array.from(email_airbnb));
    const email_coinbase = fs.readFileSync(email_file_coinbase);
    console.log(Uint8Array.from(email_coinbase));
    // Key difference: file load has 13 10, web version has just 10
  }

  async function make_input_file() {
    const [circuitInputs_airbnb, circuitInputs_coinbase] = await Promise.all([do_generate(KYCType.AIRBNB), do_generate(KYCType.COINBASE)]);
    fs.writeFileSync(`./circuits/inputs/input_airbnb.json`, JSON.stringify(circuitInputs_airbnb), { flag: "w"});
    fs.writeFileSync(`./circuits/inputs/input_coinbase.json`, JSON.stringify(circuitInputs_coinbase), { flag: "w"});

    let input_kyc: {[key:string]: any} = {};
    for (const key in circuitInputs_airbnb) {
      input_kyc[key.concat("_airbnb")] = circuitInputs_airbnb[key as keyof ICircuitInputs];
      input_kyc[key.concat("_coinbase")] = circuitInputs_coinbase[key as keyof ICircuitInputs];
    }
    fs.writeFileSync(`./circuits/inputs/input_kyc.json`, JSON.stringify(input_kyc), { flag: "w"});
  }
  
  // If main
  if (typeof require !== "undefined" && require.main === module) {
    // debug_file();
    // const circuitInputs_airbnb = do_generate(KYCType.AIRBNB);
    // const circuitInputs_coinbase = do_generate(KYCType.COINBASE);
    console.log("Writing to file...");
    // circuitInputs_airbnb.then((inputs) => fs.writeFileSync(`./circuits/inputs/input_airbnb.json`, JSON.stringify(inputs), { flag: "w" }));
    // circuitInputs_coinbase.then((inputs) => fs.writeFileSync(`./circuits/inputs/input_coinbase.json`, JSON.stringify(inputs), { flag: "w" }));
    // gen_test();

    make_input_file();
  }
  