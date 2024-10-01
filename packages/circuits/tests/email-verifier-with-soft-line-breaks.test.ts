import fs from "fs";
import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { DKIMVerificationResult } from "@zk-email/helpers/src/dkim";
import { generateEmailVerifierInputsFromDKIMResult } from "@zk-email/helpers/src/input-generators";
import { verifyDKIMSignature } from "@zk-email/helpers/src/dkim";

describe("EmailVerifier : With soft line breaks", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let dkimResult: DKIMVerificationResult;
    let circuit: any;

    beforeAll(async () => {
        const rawEmail = fs.readFileSync(
            path.join(__dirname, "./test-emails/lorem_ipsum.eml"),
            "utf8"
        );
        dkimResult = await verifyDKIMSignature(rawEmail);

        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/email-verifier-with-soft-line-breaks-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should verify email when removeSoftLineBreaks is true", async function () {
        const emailVerifierInputs = generateEmailVerifierInputsFromDKIMResult(
            dkimResult,
            {
                maxHeadersLength: 640,
                maxBodyLength: 1408,
                ignoreBodyHashCheck: false,
                removeSoftLineBreaks: true,
            }
        );

        const witness = await circuit.calculateWitness(emailVerifierInputs);
        await circuit.checkConstraints(witness);
    });
});
