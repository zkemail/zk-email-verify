import fs from "fs";
import { buildMimcSponge } from "circomlibjs";
import { wasm as wasm_tester } from "circom_tester";
import { Scalar } from "ffjavascript";
import path from "path";


import { DKIMVerificationResult, generateCircuitInputs, verifyDKIMSignature, sha256Pad, shaHash, Uint8ArrayToCharArray, uint8ToBits } from "@zkemail/helpers";

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("SHA256 for email header", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(
      path.join(__dirname, "./sha256-test.circom"),
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

  it("should hash correctly", async function () {
    const inputs = [
      "0", "hello world", ""
    ]
    for (const input of inputs) {
      const [
        paddedMsg,
        messageLen,
      ] = sha256Pad(
        Buffer.from(input, "ascii"), 640
      )

      const witness = await circuit.calculateWitness({
        in_len_padded_bytes: messageLen,
        in_padded: Uint8ArrayToCharArray(paddedMsg)
      });

      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, { out: [...uint8ToBits(shaHash(Buffer.from(input, "ascii")))] })
    }
  });
});
