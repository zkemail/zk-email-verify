import pako from 'pako';

// uncompresses single .gz file.
// returns the contents as an ArrayBuffer
export const uncompressGz =  async (arrayBuffer: ArrayBuffer): Promise<ArrayBuffer> => {
  const output = pako.ungzip(arrayBuffer);
  const buff = output.buffer;
  return buff;
}
