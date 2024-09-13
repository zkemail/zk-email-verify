import fs from "fs";
import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { DKIMVerificationResult } from "@zk-email/helpers/src/dkim";
import { generateEmailVerifierInputsFromDKIMResult } from "@zk-email/helpers/src/input-generators";
import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";
import { poseidonLarge } from "@zk-email/helpers/src/hash";

describe("EmailVerifier", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let dkimResult: DKIMVerificationResult;
    let circuit: any;

    beforeAll(async () => {
        const rawEmail = fs.readFileSync(
            path.join(__dirname, "./test-emails/test.eml")
        );
        dkimResult = await verifyDKIMSignature(rawEmail);

        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/email-verifier-test.circom"),
            {
                // @dev During development recompile can be set to false if you are only making changes in the tests.
                // This will save time by not recompiling the circuit every time.
                // Compile: circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuits"
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should verify email without any SHA precompute selector", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        const witness = await circuit.calculateWitness(emailVerifierInputs);
        await circuit.checkConstraints(witness);
    });

    it("should verify email with a SHA precompute selector", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                shaPrecomputeSelector: "How are",
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        const witness = await circuit.calculateWitness(emailVerifierInputs);
        await circuit.checkConstraints(witness);
    });

    it("should fail if the rsa signature is wrong", async function () {
        const invalidRSASignature = dkimResult.signature + 1n;
        const dkim = { ...dkimResult, signature: invalidRSASignature };

        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkim,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        expect.assertions(1);
        try {
            const witness = await circuit.calculateWitness(emailVerifierInputs);
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });

    it("should fail if message is tampered", async function () {
        const invalidHeader = Buffer.from(dkimResult.headers);
        invalidHeader[0] = 1;

        const dkim = { ...dkimResult, headers: invalidHeader };

        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkim,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        expect.assertions(1);
        try {
            const witness = await circuit.calculateWitness(emailVerifierInputs);
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });

    it("should fail if message padding is tampered", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );
        emailVerifierInputs.emailHeader[640 - 1] = "1";

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

        const dkim = { ...dkimResult, body: invalidBody };

        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkim,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        expect.assertions(1);
        try {
            const witness = await circuit.calculateWitness(emailVerifierInputs);
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });

    it("should fail if body padding is tampered", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );
        emailVerifierInputs.emailBody![768 - 1] = "1";

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

        const dkim = { ...dkimResult, bodyHash: invalidBodyHash };

        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkim,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        expect.assertions(1);
        try {
            const witness = await circuit.calculateWitness(emailVerifierInputs);
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });

    it("should produce dkim pubkey hash correctly", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                shaPrecomputeSelector: "How are",
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        // Calculate the Poseidon hash with pubkey chunked to 9*242 like in circuit
        const poseidonHash = await poseidonLarge(dkimResult.publicKey, 9, 242);

        // Calculate the hash using the circuit
        const witness = await circuit.calculateWitness(emailVerifierInputs);

        await circuit.assertOut(witness, {
            pubkeyHash: poseidonHash,
        });
    });
});
