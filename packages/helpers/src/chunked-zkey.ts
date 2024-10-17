import localforage from 'localforage';
// @ts-ignore
import pako from 'pako';
// @ts-ignore
import * as snarkjs from 'snarkjs';

const zkeyExtension = '.gz';
const zkeyExtensionRegEx = new RegExp(`\\b${zkeyExtension}$\\b`, 'i'); // = /.gz$/i
const zkeySuffix = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];

// uncompresses single .gz file.
// returns the contents as an ArrayBuffer
export const uncompressGz = async (arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  const output = pako.ungzip(arrayBuffer);
  const buff = output.buffer;
  return buff;
};

// We can use this function to ensure the type stored in localforage is correct.
async function storeArrayBuffer(keyname: string, buffer: ArrayBuffer) {
  return localforage.setItem(keyname, buffer);
}

async function downloadWithRetries(link: string, downloadAttempts: number) {
  for (let i = 1; i <= downloadAttempts; i++) {
    console.log(`download attempt ${i} for ${link}`);
    const response = await fetch(link, { method: 'GET' });
    if (response.status === 200) {
      return response;
    }
  }
  throw new Error(`Error downloading ${link} after ${downloadAttempts} retries`);
}

// GET the compressed file from the remote server, then store it with localforage
// Note that it must be stored as an uncompressed ArrayBuffer
// and named such that filename===`${name}.zkey${a}` in order for it to be found by snarkjs.
export async function downloadFromFilename(baseUrl: string, filename: string, compressed = false) {
  const link = baseUrl + filename;

  const zkeyResp = await downloadWithRetries(link, 3);

  const zkeyBuff = await zkeyResp.arrayBuffer();
  if (!compressed) {
    await storeArrayBuffer(filename, zkeyBuff);
  } else {
    // uncompress the data
    const zkeyUncompressed = await uncompressGz(zkeyBuff);
    const rawFilename = filename.replace(zkeyExtensionRegEx, ''); // replace .gz with ""
    // store the uncompressed data
    console.log('storing file in localforage', rawFilename);
    await storeArrayBuffer(rawFilename, zkeyUncompressed);
    console.log('stored file in localforage', rawFilename);
    // await localforage.setItem(filename, zkeyBuff);
  }
  console.log(`Storage of ${filename} successful!`);
}

export async function downloadProofFiles(baseUrl: string, circuitName: string, onFileDownloaded: () => void) {
  const filePromises = [];
  for (const c of zkeySuffix) {
    const targzFilename = `${circuitName}.zkey${c}${zkeyExtension}`;
    // const itemCompressed = await localforage.getItem(targzFilename);
    const item = await localforage.getItem(`${circuitName}.zkey${c}`);
    if (item) {
      console.log(`${circuitName}.zkey${c}${item ? '' : zkeyExtension} already found in localforage!`);
      onFileDownloaded();
      continue;
    }
    filePromises.push(downloadFromFilename(baseUrl, targzFilename, true).then(() => onFileDownloaded()));
  }
  console.log(filePromises);
  await Promise.all(filePromises);
}

export async function generateProof(input: any, baseUrl: string, circuitName: string) {
  // TODO: figure out how to generate this s.t. it passes build
  console.log('generating proof for input');
  console.log(input);
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    `${baseUrl}${circuitName}.wasm`,
    `${circuitName}.zkey`,
  );
  console.log(`Generated proof ${JSON.stringify(proof)}`);

  return {
    proof,
    publicSignals,
  };
}

export async function verifyProof(proof: any, publicSignals: any, baseUrl: string, circuitName: string) {
  console.log('PROOF', proof);
  console.log('PUBLIC SIGNALS', publicSignals);

  const response = await downloadWithRetries(`${baseUrl}${circuitName}.vkey.json`, 3);
  const vkey = await response.json();
  console.log('vkey', vkey);

  const proofVerified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  console.log('proofV', proofVerified);

  return proofVerified;
}

function bigIntToArray(n: number, k: number, x: bigint) {
  let divisor = 1n;
  for (let idx = 0; idx < n; idx++) {
    divisor *= 2n;
  }

  const ret = [];
  let temp = BigInt(x);
  for (let idx = 0; idx < k; idx++) {
    ret.push(temp % divisor);
    temp /= divisor;
  }
  return ret;
}

// taken from generation code in dizkus-circuits tests
function pubkeyToXYArrays(pk: string) {
  const XArr = bigIntToArray(64, 4, BigInt(`0x${pk.slice(4, 4 + 64)}`)).map((el) => el.toString());
  const YArr = bigIntToArray(64, 4, BigInt(`0x${pk.slice(68, 68 + 64)}`)).map((el) => el.toString());

  return [XArr, YArr];
}

// taken from generation code in dizkus-circuits tests
function sigToRSArrays(sig: string) {
  const rArr = bigIntToArray(64, 4, BigInt(`0x${sig.slice(2, 2 + 64)}`)).map((el) => el.toString());
  const sArr = bigIntToArray(64, 4, BigInt(`0x${sig.slice(66, 66 + 64)}`)).map((el) => el.toString());

  return [rArr, sArr];
}

export function buildInput(pubkey: string, msghash: string, sig: string) {
  const [r, s] = sigToRSArrays(sig);

  return {
    r,
    s,
    msghash: bigIntToArray(64, 4, BigInt(msghash)),
    pubkey: pubkeyToXYArrays(pubkey),
  };
}
