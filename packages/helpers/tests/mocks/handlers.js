import { rest } from 'msw'
import fs from 'fs';
import path from 'path';

export const loadURL = "https://test/endpoint/";

const getCompressedTestFile = () => {
  const buffer = fs.readFileSync(path.join(__dirname, `../test-data/compressed-files/compressed.txt.gz`));
  return buffer;
}

const zkeyGzHandler = async (_, res, ctx) => {
    const mockGzArrayBuffer = getCompressedTestFile();
    return res(
      ctx.set('Content-Length', mockGzArrayBuffer.byteLength.toString()),
      ctx.set('Content-Type', 'application/x-gzip'),
      // Respond with the "ArrayBuffer".
      ctx.body(mockGzArrayBuffer),
    )
};

export const MOCK_BASE_URL = "http://mock.mock/";

export const handlers = [
  // Handles a .gz request
  rest.get(MOCK_BASE_URL + "email.zkeyb.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyc.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyd.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeye.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyf.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyg.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyh.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyi.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyj.gz", zkeyGzHandler),
  rest.get(MOCK_BASE_URL + "email.zkeyk.gz", zkeyGzHandler),
];
