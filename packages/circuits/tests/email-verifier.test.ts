import { bigIntToChunkedBytes } from "@zk-email/helpers/src/binaryFormat";
import { DKIMVerificationResult } from "@zk-email/helpers/src/dkim";
import { generateCircuitInputs } from "@zk-email/helpers/src/input-helpers";
// import { buildPoseidon } from "circomlibjs";

const { verifyDKIMSignature } = require("@zk-email/helpers/src/dkim");
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
      path.join(__dirname, "./test.eml"),
      "utf8"
    );
    dkimResult = await verifyDKIMSignature(rawEmail);

    circuit = await wasm_tester(
      path.join(__dirname, "./email-verifier-test.circom"),
      {
        // NOTE: We are running tests against pre-compiled circuit in the below path
        // You need to manually compile when changes are made to circuit if `recompile` is set to `false`.
        // circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuit"
        recompile: false,
        output: path.join(__dirname, "./compiled-test-circuit"),
        include: path.join(__dirname, "../../../node_modules"),
      }
    );
  });

  it("should verify email without any SHA precompute selector", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    const witness = await circuit.calculateWitness(emailVerifierInputs);
    await circuit.checkConstraints(witness);
  });

  it("should verify email with a SHA precompute selector", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    const witness = await circuit.calculateWitness(emailVerifierInputs);
    await circuit.checkConstraints(witness);
  });

  it("should fail if the rsa signature is wrong", async function () {
    const invalidRSASignature = dkimResult.signature + 1n;

    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: invalidRSASignature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness(emailVerifierInputs);
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });

  it("should fail if precompute string is not found in body", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "invalid",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness(emailVerifierInputs);
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });

  it("should fail if message is tampered", async function () {
    const invalidMessage = Buffer.from(dkimResult.message);
    invalidMessage[0] = 1;

    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: invalidMessage,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness(emailVerifierInputs);
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });

  it("should fail if body is tampered", async function () {
    const invalidBody = Buffer.from(dkimResult.body);
    invalidBody[invalidBody.length - 1] = 1;

    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: invalidBody,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness(emailVerifierInputs);
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });

  it("should fail if body hash is tampered", async function () {
    const invalidBodyHash = dkimResult.bodyHash + "a";

    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: invalidBodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    expect.assertions(1);
    try {
      const witness = await circuit.calculateWitness(emailVerifierInputs);
      await circuit.checkConstraints(witness);
    } catch (error) {
      expect((error as Error).message).toMatch("Assert Failed");
    }
  });

  it("should produce dkim key hash correctly", async function () {
    const emailVerifierInputs = generateCircuitInputs({
      rsaSignature: dkimResult.signature,
      rsaPublicKey: dkimResult.publicKey,
      body: dkimResult.body,
      bodyHash: dkimResult.bodyHash,
      message: dkimResult.message,
      shaPrecomputeSelector: "How are",
      maxMessageLength: 640,
      maxBodyLength: 768,
    });

    // Calculate the poseidon hash using JS by splitting pubKey to 9 chunks of 242
    // TODO: Fix this. This test is not working; the hash returned by the circom is different from
    // the one computed locally.

    // const poseidon = await buildPoseidon();
    // const chunked = bigIntToChunkedBytes(dkimResult.publicKey, 242, 9);
    // const hash = poseidon(chunked);
    // const hashInt = BigInt(parseInt(Buffer.from(hash).toString('hex'), 16)).toString();

    const witness = await circuit.calculateWitness(emailVerifierInputs);

    const gmailHash = "9601655888625014162288850419683651547363906810920337900608272342042199343577";

    await circuit.assertOut(witness, {
      pubkey_hash: gmailHash
    });
  });
});
