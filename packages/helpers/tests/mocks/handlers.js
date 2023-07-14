import { rest } from 'msw'
import { loadURL } from '../../src/zkp'
import fs from 'fs';
import path from 'path';

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

export const handlers = [
  // Handles a .gz request
  rest.get(loadURL + "email.zkeyb.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyc.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyd.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeye.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyf.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyg.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyh.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyi.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyj.gz", zkeyGzHandler),
  rest.get(loadURL + "email.zkeyk.gz", zkeyGzHandler),
];
