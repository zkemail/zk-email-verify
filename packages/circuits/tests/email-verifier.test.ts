import { DKIMVerificationResult } from "@zk-email/helpers/dkim";
import { generateCircuitInputs } from "@zk-email/helpers/input-helpers";

const { verifyDKIMSignature } = require("@zk-email/helpers/dkim");
const fs = require("fs");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("EmailVerifier", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let dkimResult: DKIMVerificationResult;
  let circuit: any;

  beforeAll(async () => {
    const rawEmail = fs.readFileSync(
      path.join(__dirname, "./emls/sample.eml"),
      "utf8"
    );
    dkimResult = await verifyDKIMSignature(rawEmail);

    circuit = await wasm_tester(
      path.join(__dirname, "./email-verifier-test.circom"),
      {
        // NOTE: We are running tests against pre-compiler circuit in the below path
        // You need to manually compile when changes are made to circuit if recompile is set to `false`.
        // circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuit"
        recompile: false,
        output: path.join(__dirname, "./compiled-test-circuit"),
      }
    );
  });

  it("should verify email with a SHA precompute selector", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaModulus: dkimResult.modulus,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    await circuit.calculateWitness(emailVerifierInputs);
  });
});
