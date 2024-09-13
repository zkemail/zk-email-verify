import fs from "fs";
import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { DKIMVerificationResult } from "@zk-email/helpers/src/dkim";
import { generateEmailVerifierInputsFromDKIMResult } from "@zk-email/helpers/src/input-generators";
import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";

describe("EmailVerifier : With body masking", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let dkimResult: DKIMVerificationResult;
    let circuit: any;

    beforeAll(async () => {
        const rawEmail = fs.readFileSync(
            path.join(__dirname, "./test-emails/test.eml")
        );
        dkimResult = await verifyDKIMSignature(rawEmail);

        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/email-verifier-with-body-mask-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should verify email with body masking", async function () {
        const mask = Array.from({ length: 768 }, (_, i) =>
            i > 25 && i < 50 ? 1 : 0
        );

        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
                ignoreBodyHashCheck: false,
                enableBodyMasking: true,
                bodyMask: mask.map((value) => (value ? 1 : 0)),
            }
        );

        const expectedMaskedBody = emailVerifierInputs.emailBody!.map(
            (byte, i) => (mask[i] === 1 ? byte : 0)
        );

        const witness = await circuit.calculateWitness(emailVerifierInputs);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {
            maskedBody: expectedMaskedBody,
        });
    });
});
