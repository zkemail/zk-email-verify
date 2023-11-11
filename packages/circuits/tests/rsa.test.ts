import fs from "fs";
import { buildMimcSponge } from "circomlibjs";
import { wasm as wasm_tester } from "circom_tester";
import { Scalar } from "ffjavascript";
import path from "path";

import { DKIMVerificationResult, generateCircuitInputs, verifyDKIMSignature } from "@zk-email/helpers";

exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("RSA", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let circuit: any;
  let dkimResult: DKIMVerificationResult;

  beforeAll(async () => {
    circuit = await wasm_tester(
      path.join(__dirname, "./rsa-test.circom"),
      {
        // @dev During development recompile can be set to false if you are only making changes in the tests.
        // This will save time by not recompiling the circuit every time.
        // Compile: circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuit"
        recompile: true,
        output: path.join(__dirname, "./compiled-test-circuit"),
        include: path.join(__dirname, "../../../node_modules"),
      }
    );
    const rawEmail = fs.readFileSync(path.join(__dirname, "./test.eml"));
    dkimResult = await verifyDKIMSignature(rawEmail);
  });

  it("should verify rsa signature correctly", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      maxMessageLength: 640,
      maxBodyLength: 768,
    });


    const witness = await circuit.calculateWitness({
      signature: emailVerifierInputs.signature,
      modulus: emailVerifierInputs.pubkey,
      // TODO: generate this from the input
      base_message: ["1156466847851242602709362303526378170", "191372789510123109308037416804949834", "7204", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
    });
    await circuit.checkConstraints(witness);
    await circuit.assertOut(witness, {})
  });

  it("should fail when verifying with an incorrect signature", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      maxMessageLength: 640,
      maxBodyLength: 768,
    });


    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness({
        signature: emailVerifierInputs.signature,
        modulus: emailVerifierInputs.pubkey,
        base_message: ["1156466847851242602709362303526378171", "191372789510123109308037416804949834", "7204", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
      });
      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, {})
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });
});
