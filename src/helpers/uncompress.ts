import pako from 'pako';
// @ts-ignore
import untar from 'js-untar';

// js-tar doesn't have a type.d so we add a type here.
type TarFile = {
  name: string,
  buffer: ArrayBuffer
}

// uncompresses a tarball containing a single .zkey* file.
// returns the contents of that file as an ArrayBuffer
const uncompressZkeydTarball = async (arrayBuffer:ArrayBuffer): Promise<ArrayBuffer> => {
  console.log(`Started to uncompress tarball...!`);

  // ungzip file
  const output = pako.ungzip(arrayBuffer);
  const buff = output.buffer;

  // extract file(s) from tar
  const files = await untar(buff);
  console.log("files in tar file:", files.map((file: TarFile) => file.name));
  // check for files ending in .zkey*.
  const zkeydFiles: TarFile[] = files.filter((file: TarFile) => file.name.match(/(.+)\.zkey.$/)?.[0]);
  const fileNames: string[] = zkeydFiles.map((file: TarFile) => file.name);
  console.log(fileNames.length, ".zkey* files in tar file:", fileNames);

  if (zkeydFiles.length === 1) {
    // find one file from the tar file.
    const file = zkeydFiles[0];
    return file.buffer;
  } else if (zkeydFiles.length > 1) {
    throw new Error("More than one .zkey* files found in tarball");
  } else {
    throw new Error("No .zkey* files found in tarball.");
  }
}

export {uncompressZkeydTarball, type TarFile};
