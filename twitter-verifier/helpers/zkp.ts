import { vkey } from "./vkey";
import localforage from "localforage";
import { uncompressGz as uncompress } from "./uncompress";

const snarkjs = require("snarkjs");

export const loadURL = "https://zkemail-zkey-chunks.s3.amazonaws.com/";
const compressed = true;
// const loadURL = "/zkemail-zkey-chunks/";

const zkeyExtension = ".gz"
const zkeyExtensionRegEx = new RegExp(`\\b${zkeyExtension}$\\b`, 'i') // = /.gz$/i
const zkeySuffix = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];


// We can use this function to ensure the type stored in localforage is correct.
async function storeArrayBuffer(keyname: string, buffer: ArrayBuffer) {
  return await localforage.setItem(keyname, buffer);
}

// GET the compressed file from the remote server, then store it with localforage
// Note that it must be stored as an uncompressed ArrayBuffer
// and named such that filename===`${name}.zkey${a}` in order for it to be found by snarkjs.
export async function downloadFromFilename(filename: string, compressed = false) {
  const link = loadURL + filename;
  try {
    const zkeyResp = await fetch(link, {
      method: "GET",
    });
    const zkeyBuff = await zkeyResp.arrayBuffer();
    if (!compressed) {
      await storeArrayBuffer(filename, zkeyBuff);
    } else {
      // uncompress the data
      const zkeyUncompressed = await uncompress(zkeyBuff);
      const rawFilename = filename.replace(zkeyExtensionRegEx, ""); // replace .gz with ""
      // store the uncompressed data
      console.log("storing file in localforage", rawFilename);
      await storeArrayBuffer(rawFilename, zkeyUncompressed);
      console.log("stored file in localforage", rawFilename);
      // await localforage.setItem(filename, zkeyBuff);
    }
    console.log(`Storage of ${filename} successful!`);
  } catch (e) {
    console.log(`Storage of ${filename} unsuccessful, make sure IndexedDB is enabled in your browser.`);
    console.log(e);
  }
}

export const downloadProofFiles = async function (filename: string, onFileDownloaded: () => void) {
  const filePromises = [];
  for (const c of zkeySuffix) {
    const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
    const itemCompressed = await localforage.getItem(targzFilename);
    const item = await localforage.getItem(`${filename}.zkey${c}`);
    if (item) {
      console.log(`${filename}.zkey${c}${item ? "" : zkeyExtension} already found in localstorage!`);
      onFileDownloaded();
      continue;
    }
    filePromises.push(
      // downloadFromFilename(targzFilename, true).then(
      downloadFromFilename(targzFilename, compressed).then(() => onFileDownloaded())
    );
  }
  console.log(filePromises);
  await Promise.all(filePromises);
};

export const uncompressProofFiles = async function (filename: string) {
  const filePromises = [];
  for (const c of zkeySuffix) {
    const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
    const item = await localforage.getItem(`${filename}.zkey${c}`);
    const itemCompressed = await localforage.getItem(targzFilename);
    if (!itemCompressed) {
      console.error(`Error downloading file ${targzFilename}`);
    } else {
      console.log(`${filename}.zkey${c}${item ? "" : zkeyExtension} already found in localstorage!`);
      continue;
    }
    filePromises.push(downloadFromFilename(targzFilename));
  }
  console.log(filePromises);
  await Promise.all(filePromises);
};

export async function generateProof(input: any, filename: string) {
  // TODO: figure out how to generate this s.t. it passes build
  console.log("generating proof for input");
  console.log(input);
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `${loadURL}${filename}.wasm`, `${filename}.zkey`);
  console.log(`Generated proof ${JSON.stringify(proof)}`);

  return {
    proof,
    publicSignals,
  };
}

export async function verifyProof(proof: any, publicSignals: any) {
  console.log("PROOF", proof);
  console.log("PUBLIC SIGNALS", publicSignals);
  console.log("VK", vkey);
  const proofVerified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  console.log("proofV", proofVerified);

  return proofVerified;
}

function bigIntToArray(n: number, k: number, x: bigint) {
  let divisor = 1n;
  for (var idx = 0; idx < n; idx++) {
    divisor = divisor * 2n;
  }

  let ret = [];
  var x_temp = BigInt(x);
  for (var idx = 0; idx < k; idx++) {
    ret.push(x_temp % divisor);
    x_temp = x_temp / divisor;
  }
  return ret;
}

// taken from generation code in dizkus-circuits tests
function pubkeyToXYArrays(pk: string) {
  const XArr = bigIntToArray(64, 4, BigInt("0x" + pk.slice(4, 4 + 64))).map((el) => el.toString());
  const YArr = bigIntToArray(64, 4, BigInt("0x" + pk.slice(68, 68 + 64))).map((el) => el.toString());

  return [XArr, YArr];
}

// taken from generation code in dizkus-circuits tests
function sigToRSArrays(sig: string) {
  const rArr = bigIntToArray(64, 4, BigInt("0x" + sig.slice(2, 2 + 64))).map((el) => el.toString());
  const sArr = bigIntToArray(64, 4, BigInt("0x" + sig.slice(66, 66 + 64))).map((el) => el.toString());

  return [rArr, sArr];
}

export function buildInput(pubkey: string, msghash: string, sig: string) {
  const [r, s] = sigToRSArrays(sig);

  return {
    r: r,
    s: s,
    msghash: bigIntToArray(64, 4, BigInt(msghash)),
    pubkey: pubkeyToXYArrays(pubkey),
  };
}
