import fs from "fs";
import { buildMimcSponge } from "circomlibjs";
import { wasm as wasm_tester } from "circom_tester";
import { Scalar } from "ffjavascript";
import path from "path";

import { DKIMVerificationResult, generateCircuitInputs, verifyDKIMSignature } from "@zk-email/helpers";

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("Base64 Lookup", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(
      path.join(__dirname, "./base64-test.circom"),
      {
        // @dev During development recompile can be set to false if you are only making changes in the tests.
        // This will save time by not recompiling the circuit every time.
        // Compile: circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuit"
        recompile: true,
        output: path.join(__dirname, "./compiled-test-circuit"),
        include: path.join(__dirname, "../../../node_modules"),
      }
    );
  });

  it("should decode valid base64 chars", async function () {
    const inputs = [
      [65, 0], // A
      [90, 25], // Z
      [97, 26], // a
      [122, 51], // z
      [48, 52], // 0
      [57, 61], // 9
      [43, 62], // +
      [47, 63], // /
      [61, 0], // =
    ]

    for (const [input, output] of inputs) {
      const witness = await circuit.calculateWitness({
        in: input
      });
      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, { out: output })
    }
  });

  it("should fail with invalid chars", async function () {
    const inputs = [34, 64, 91, 44];

    expect.assertions(inputs.length);
    for (const input of inputs) {
    try {
      const witness = await circuit.calculateWitness({
        in: input
      });
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
    }
  });
});
