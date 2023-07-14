import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";
import { generateTwitterVerifierCircuitInputs } from "../helpers";
import snarkjs from "snarkjs";

const path = require("path");
const fs = require("fs");
const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("Twitter email test", function () {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let dkimResult: import("@zk-email/helpers/src/dkim").DKIMVerificationResult;
  let circuit: any;

  beforeAll(async () => {
    const rawEmail = fs.readFileSync(
      path.join(__dirname, "../../../emls/zktestemail_twitter.eml"),
      "utf8"
    );
    dkimResult = await verifyDKIMSignature(rawEmail);

    circuit = await wasm_tester(path.join(__dirname, "../twitter.circom"), {
      // NOTE: We are running tests against pre-compiled circuit in the below path
      // You need to manually compile when changes are made to circuit if `recompile` is set to `false`.
      recompile: false,
      output: path.join(__dirname, "../build/twitter"),
    });
  });

  it("should verify twitter email", async function () {
    const twitterVerifierInputs = generateTwitterVerifierCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaModulus: dkimResult.modulus,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      ethereumAddress: "0x00000000000000000000",
    });

    const witness = await circuit.calculateWitness(twitterVerifierInputs);
    await circuit.checkConstraints(witness);
  });
});
