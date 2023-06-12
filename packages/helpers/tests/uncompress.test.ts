import { StringDecoder } from "string_decoder";
import { uncompressGz as uncompress } from "../uncompress";
import fs from 'fs';
import path from 'path';

const getCompressedTestFile = (): ArrayBuffer => {
  const buffer = fs.readFileSync(path.join(__dirname, `test-data/compressed-files/compressed.txt.gz`));
  return buffer;
}

const getUncompressedTestFile = (): ArrayBuffer => {
  const buffer = fs.readFileSync(path.join(__dirname, `test-data/compressed-files/uncompressed-value.txt`));
  return buffer;
}

describe('Uncompress GZ file', () => {
  test('Uncompresss a GZ file', async () => {
    const decoder = new StringDecoder('utf8');
    const compressedArrayBuffer: ArrayBuffer = getCompressedTestFile();
    const expectedArrayBuffer: ArrayBuffer = getUncompressedTestFile();
    const expectedString = decoder.write(Buffer.from(expectedArrayBuffer));
    const uncompressedArrayBuffer = await uncompress(compressedArrayBuffer);
    const uncompressedString = decoder.write(Buffer.from(uncompressedArrayBuffer));
    expect(uncompressedString).toBe(expectedString);
  });
});