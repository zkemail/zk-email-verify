import fs from "fs";
import { buildPoseidon } from "circomlibjs";
import { wasm as wasm_tester } from "circom_tester";
import { Scalar } from "ffjavascript";
import path from "path";

import { DKIMVerificationResult, generateCircuitInputs, verifyDKIMSignature, bigIntToChunkedBytes } from "@zk-email/helpers";


exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

describe("EmailVerifier", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  let dkimResult: DKIMVerificationResult;
  let circuit: any;

  beforeAll(async () => {
    const rawEmail = fs.readFileSync(path.join(__dirname, "./test.eml"));
    dkimResult = await verifyDKIMSignature(rawEmail);

    circuit = await wasm_tester(
      path.join(__dirname, "./email-verifier-test.circom"),
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

  it("should produce dkim pubkey hash correctly", async function () {
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

    // Calculate the Poseidon hash with pubkey chunked to 9*242 like in circuit
    const poseidon = await buildPoseidon();
    const pubkeyChunked = bigIntToChunkedBytes(dkimResult.publicKey, 242, 9);
    const hash = poseidon(pubkeyChunked);

    // Calculate the hash using the circuit
    const witness = await circuit.calculateWitness(emailVerifierInputs);

    await circuit.assertOut(witness, {
      pubkey_hash: poseidon.F.toObject(hash),
    });
  });
});
