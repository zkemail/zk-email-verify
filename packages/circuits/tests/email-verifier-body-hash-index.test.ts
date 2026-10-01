import fs from "fs";
import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { generateEmailVerifierInputsFromDKIMResult } from "@zk-email/helpers/src/input-generators";
import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";

// bodyHashIndex must point inside the header. With maxHeadersLength = 576 (not a power of two),
// VarShiftLeft accepts any index below 1024 and rotates it modulo 576, so index + 576 selects the
// same bytes as index while matching no position in SelectRegexReveal's checks.
describe("EmailVerifier bodyHashIndex range", () => {
    jest.setTimeout(30 * 60 * 1000);

    let inputs: any;
    let circuit: any;

    beforeAll(async () => {
        const rawEmail = fs.readFileSync(path.join(__dirname, "./test-emails/test.eml"));
        const dkimResult = await verifyDKIMSignature(rawEmail);
        inputs = generateEmailVerifierInputsFromDKIMResult(dkimResult, {
            maxHeadersLength: 576,
            maxBodyLength: 768,
        });

        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/email-verifier-576-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("accepts the honest bodyHashIndex", async () => {
        const witness = await circuit.calculateWitness(inputs);
        await circuit.checkConstraints(witness);
    });

    it("rejects a bodyHashIndex past the header that wraps onto the same bytes", async () => {
        const wrapped = Number(inputs.bodyHashIndex) + 576;
        // Precondition: still inside VarShiftLeft's and SelectRegexReveal's bit ranges, so only
        // the new range check can reject it.
        expect(wrapped + 43).toBeLessThan(1024);

        expect.assertions(2);
        try {
            const witness = await circuit.calculateWitness({ ...inputs, bodyHashIndex: wrapped.toString() });
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });
});
