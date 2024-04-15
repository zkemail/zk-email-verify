import fs from 'fs';
import path from 'path';
import { StringDecoder } from 'string_decoder';
import _localforage from 'localforage';
import { downloadFromFilename, downloadProofFiles, uncompressGz as uncompress } from '../src/chunked-zkey';
import { server } from './mocks/server';
import { MOCK_BASE_URL } from './mocks/handlers';

// this is mocked in __mocks__/localforage.ts
jest.mock('localforage');

const localforage = _localforage as jest.Mocked<typeof _localforage>;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// localforage should be storing ArrayBuffers.
// We can use this function to simplify checking the mocked value of the ArrayBuffer.
const decodeArrayBufferToString = (buffer: ArrayBuffer): string => {
  const decoder = new StringDecoder('utf8');
  const str = decoder.write(Buffer.from(buffer));
  return str;
};

const getCompressedTestFile = (): ArrayBuffer => {
  const buffer = fs.readFileSync(path.join(__dirname, 'test-data/compressed-files/compressed.txt.gz'));
  return buffer;
};

const getUncompressedTestFile = (): ArrayBuffer => {
  const buffer = fs.readFileSync(path.join(__dirname, 'test-data/compressed-files/uncompressed-value.txt'));
  return buffer;
};

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

describe('Test zkp fetch and store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should fetch a gz file, uncompress it, and store it in indexeddb', async () => {
    const filename = 'email.zkeyb.gz';
    // downloadFileFromFilename requests the file from the server, which we mocked with msw.
    // The server returns a gz file of a file containing "not compressed 👍",
    // which is defined in __fixtures__/compressed-files/compressed.txt.gz
    await downloadFromFilename(MOCK_BASE_URL, filename, true);
    // check that localforage.setItem was called once to save the zkey file.
    expect(localforage.setItem).toBeCalledTimes(1);
    const filenameRaw = localforage.setItem.mock.calls[0][0];
    const decompressedBuffer = localforage.setItem.mock.calls[0][1] as ArrayBuffer;

    // expect to be called with...
    const str = decodeArrayBufferToString(decompressedBuffer);
    expect(filenameRaw).toBe('email.zkeyb');
    // check that it decompressed the file correctly.
    expect(str).toBe('not compressed 👍');
  });

  test('should should download all the zkeys and save them in local storage for snarkjs to access.', async () => {
    // downloadProofFiles calls downloadFromFilename 10 times, one for each zkey, b-k.
    const onDownloaded = jest.fn();
    await downloadProofFiles(MOCK_BASE_URL, 'email', onDownloaded);
    expect(localforage.setItem).toBeCalledTimes(10);

    // check the first one
    const filenameRawB = localforage.setItem.mock.calls[0][0];
    const decompressedBufferB = localforage.setItem.mock.calls[0][1] as ArrayBuffer;
    expect(filenameRawB).toBe('email.zkeyb');
    expect(decodeArrayBufferToString(decompressedBufferB)).toBe('not compressed 👍');
    // ... c d e f g h i j ... assume these are fine too.
    // check the last one
    const filenameRawK = localforage.setItem.mock.calls[9][0];
    const decompressedBufferK = localforage.setItem.mock.calls[9][1] as ArrayBuffer;
    expect(filenameRawK).toBe('email.zkeyk');
    expect(decodeArrayBufferToString(decompressedBufferK)).toBe('not compressed 👍');
    expect(onDownloaded).toBeCalledTimes(10);
  });
});
