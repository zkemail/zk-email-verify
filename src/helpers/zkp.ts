import { vkey } from "./vkey";

const localforage = require("localforage");
const snarkjs = require("snarkjs");
// const tar = require("tar-stream");
const zlib = require("zlib");
const tar = require("tar-stream");
// const tar = require("tar-js");
const fs = require("fs");

const loadURL = "https://zkemail-zkey-chunks.s3.amazonaws.com/";
const zkeyExtension = ".tar.gz";

// Downloads and uncompresses if compressed
export async function downloadFromFilename(filename: string, compressed = false) {
  const link = loadURL + filename;
  const uncompressFilePromises = [];
  try {
    const zkeyResp = await fetch(link, {
      method: "GET",
    });
    const zkeyBuff = await zkeyResp.arrayBuffer();
    if (!compressed) {
      await localforage.setItem(filename, zkeyBuff);
    } else {
      await uncompressAndStore(filename, zkeyBuff);
    }
    console.log(`Storage of ${filename} successful!`);
  } catch (e) {
    console.log(`Storage of ${filename} unsuccessful, make sure IndexedDB is enabled in your browser. Full error: `, e);
  }
}

// Un-targz the arrayBuffer into the filename without the .tar.gz on the end
const uncompressAndStore = async function (filename: string, arrayBuffer: ArrayBuffer) {
  console.log(`Started to uncompress ${filename}...!`);
  const rawFilename = filename.replace(/.tar.gz$/, "");

  // const uint8Array = new Uint8Array(arrayBuffer); // Convert the ArrayBuffer to a Uint8Array
  const buffer1 = Buffer.from(arrayBuffer); // Maybe unneeded
  // const buffer = Buffer.from(uint8Array); // Create a buffer from the Uint8Array
  console.log("Derived buffer");

  // Method 1
  const decompressedBuffer = zlib.gunzipSync(buffer1);
  console.log("Called gunzip", typeof decompressedBuffer);

  const bufferCopy = Buffer.from(decompressedBuffer.slice(0)); // create a copy of the buffer
  // create a new Buffer object from the ArrayBuffer of the original Buffer
  // const bufferFromArrayBuffer = Buffer.allocUnsafe(bufferCopy.buffer);

  // create a copy of the new Buffer object
  // const arrayBuffer = Buffer.from(bufferCopy).buffer;
  const uint8Array = new Uint8Array(bufferCopy); // create a Uint8Array view of the copy
  const decompressedArrayBuffer = uint8Array.buffer; // get the underlying ArrayBuffer
  console.log(
    "Lengths of compressed and uncompressed data",
    uint8Array.length,
    bufferCopy.length,
    buffer1.length,
    decompressedBuffer.length,
    uint8Array.length,
    uint8Array.slice(0, 10),
    uint8Array.slice(-10)
  );
  try {
    localforage.setItem(rawFilename, bufferCopy); // Page crashed here once
  } catch (e: any) {
    console.log("Couldn't store item", e);
  }

  // // Method 2
  // // Create a tar reader
  // const tarReader = tar.extract({
  //   // Set the path to extract the files to
  //   path: "/path/to/extract/files/to",
  // });

  // // Create a gzip reader
  // const gzipReader = new zlib.Gunzip();

  // // Pipe the tar.gz file into the gzip reader
  // (buffer as unknown as NodeJS.ReadableStream).pipe(gzipReader);

  // // Pipe the output of the gzip reader into the tar reader
  // gzipReader.pipe(tarReader);
  // console.log("reading ", rawFilename);
  // // Listen for the 'entry' event to be emitted for each file in the tar archive
  // tarReader.on("entry", (header: any, stream: any, next: any) => {
  //   // Save the file to the specified path
  //   console.log("entry", header, header.name);
  //   stream.pipe(fs.createWriteStream(header.name));

  //   // Call the next function when the stream is fin ished
  //   stream.on("end", () => {
  //     console.log("stream ended");
  //     next();
  //     console.log("next called");
  //   });
  // });

  // // Listen for the 'finish' event to be emitted when the tar archive has been fully extracted
  // tarReader.on("finish", () => {
  //   console.log("tarReader finished");
  //   // All files in the tar archive have been extracted
  // });
};

const zkeySuffix = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];

export const downloadProofFiles = async function (filename: string, onFileDownloaded: () => void) {
  const filePromises = [];
  for (const c of zkeySuffix) {
    const itemCompressed = await localforage.getItem(`${filename}.zkey${c}${zkeyExtension}`);
    const item = await localforage.getItem(`${filename}.zkey${c}`);
    if (item || itemCompressed) {
      console.log(`${filename}.zkey${c}${item ? "" : zkeyExtension} already found in localstorage!`);
      onFileDownloaded();
      continue;
    }
    filePromises.push(
      // downloadFromFilename(`${filename}.zkey${c}${zkeyExtension}`, true).then(
      downloadFromFilename(`${filename}.zkey${c}${zkeyExtension}`, false).then(() => onFileDownloaded())
    );
  }
  console.log(filePromises);
  await Promise.all(filePromises);
};

// export const uncompressProofFiles = async function (filename: string) {
//   const filePromises = [];
//   for (const c of zkeySuffix) {
//     const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
//     const item = await localforage.getItem(`${filename}.zkey${c}`);
//     const itemCompressed = await localforage.getItem(targzFilename);
//     if (!itemCompressed){
//       console.error(`Error downloading file ${targzFilename}`)
//     } else {
//       console.log(`${filename}.zkey${c}${item?"":zkeyExtension} already found in localstorage!`);
//       continue;
//     }
//     filePromises.push(downloadFromFilename(targzFilename));
//   }
//   console.log(filePromises);
//   await Promise.all(filePromises);
// };

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
  // Test code
  const filePromises = [];
  for (const c of zkeySuffix) {
    const targzFilename = `${filename}.zkey${c}${zkeyExtension}`;
    const item: ArrayBuffer = await localforage.getItem(`${filename}.zkey${c}`);
    console.log(c, item.byteLength);
  }
  // End test code
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, `https://zkemail-zkey-chunks.s3.amazonaws.com/${filename}.wasm`, `${filename}.zkey`);
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
