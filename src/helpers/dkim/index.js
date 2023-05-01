const { writeToStream } = require("./tools");
// import { writeToStream } from "./tools";
const { DkimVerifier } = require("./dkim-verifier");

export const dkimVerify = async (input, options) => {
  let dkimVerifier = new DkimVerifier(options);
  await writeToStream(dkimVerifier, input);

  const result = {
    //headers: dkimVerifier.headers,
    headerFrom: dkimVerifier.headerFrom,
    envelopeFrom: dkimVerifier.envelopeFrom,
    results: dkimVerifier.results,
  };

  if (dkimVerifier.headers) {
    Object.defineProperty(result, "headers", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: dkimVerifier.headers,
    });
  }

  return result;
};
