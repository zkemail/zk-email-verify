import { vkey } from "./vkey";

const localforage = require("localforage");
const snarkjs = require("snarkjs");
const tar = require('tar-stream')
const zlib = require('zlib')

const loadURL = "https://zkemail-zkey-chunks.s3.amazonaws.com/";

export async function downloadFromFilename(filename: string, compressed = false) {
  const link = loadURL + filename;
  const uncompressFilePromises = []
  try {
    const zkeyResp = await fetch(link, {
      method: "GET",
    });
    const zkeyBuff = await zkeyResp.arrayBuffer();
    if(!compressed){
      await localforage.setItem(filename, zkeyBuff);
    } else {
      await uncompressAndStore(zkeyBuff, filename);
    }
    console.log(`Storage of ${filename} successful!`);
  } catch (e) {
    console.log(`Storage of ${filename} unsuccessful, make sure IndexedDB is enabled in your browser.`);
  }
}

const zkeyExtension = ".tar.gz"

// Un-targz the arrayBuffer into the filename without the .tar.gz on the end
const uncompressAndStore = async function (arrayBuffer: ArrayBuffer, filename: string) {
  console.log(`Started to uncompress ${filename}...!`);
  const extract = tar.extract() // create a tar extract stream
  const gunzip = zlib.createGunzip(arrayBuffer) // create a gunzip stream from the array buffer
  gunzip.pipe(extract) // pipe the gunzip stream into the tar extract stream

  // header is the tar header, stream is the content body (might be an empty stream), call next when you are done with this entry
  extract.on('entry', function(header: any, stream: any, next: Function) {
    // decompress the entry data
    const extractedData: any = []
    stream.on('data', function(chunk: any) {
      extractedData.push(chunk)
    })

    // make sure to call next when the entry is fully processed
    stream.on('end', function() {
      next()

      console.assert(filename.endsWith(zkeyExtension), `Filename doesn't end in ${zkeyExtension}`)
      const rawFilename = filename.replace(/.tar.gz$/, "");
      // save the extracted data to localForage
      localforage.setItem(rawFilename, extractedData, function(err: Error) {
        if (err) {
          console.error(`Couldn't extract data from ${filename}:` + err.message)
        } else {
          console.log('Saved extracted file to localForage')
        }
      })
    })
  })

  // all entries have been processed
  extract.on('finish', function() {
    console.log(`Finished extracting ${filename}`)
  })
}

const zkeySuffix = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];

export const downloadProofFiles = async function (filename: string) {
  const filePromises = [];
  for (const c of zkeySuffix) {
    const itemCompressed = await localforage.getItem(`${filename}.zkey${c}${zkeyExtension}`);
    const item = await localforage.getItem(`${filename}.zkey${c}`);
    if (item || itemCompressed) {
      console.log(`${filename}.zkey${c}${item?"":zkeyExtension} already found in localstorage!`);
      continue;
    }
    filePromises.push(downloadFromFilename(`${filename}.zkey${c}${zkeyExtension}`, true));
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
    if (!itemCompressed){
      console.error(`Error downloading file ${targzFilename}`)
    } else {
      console.log(`${filename}.zkey${c}${item?"":zkeyExtension} already found in localstorage!`);
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
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `https://zkemail-zkey-chunks.s3.amazonaws.com/${filename}.wasm`, `${filename}.zkey`);
  console.log(`Generated proof ${JSON.stringify(proof)}`);

  return {
    proof,
    publicSignals,
  };
}

export async function verifyProof(proof: any, publicSignals: any) {
  const proofVerified = await snarkjs.groth16.verify(vkey, publicSignals, proof);

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
