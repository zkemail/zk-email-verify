import fs from "fs";
import path from "path";
import { wasm as wasm_tester } from "circom_tester";
import { generateEmailVerifierInputs } from "@zk-email/helpers/src/input-generators";
import { toCircomBigIntBytes } from "@zk-email/helpers/src/binary-format";

describe("RSA", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let circuit: any;
    let rawEmail: Buffer;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/rsa-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                // output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
        rawEmail = fs.readFileSync(
            path.join(__dirname, "./test-emails/test.eml")
        );
    });

    it("should verify 2048 bit rsa signature correctly", async function () {
        const emailVerifierInputs = await generateEmailVerifierInputs(
            rawEmail,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        const witness = await circuit.calculateWitness({
            signature: emailVerifierInputs.signature,
            modulus: emailVerifierInputs.pubkey,
            // TODO: generate this from the input
            message: [
                "1156466847851242602709362303526378170",
                "191372789510123109308037416804949834",
                "7204",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
            ],
        });
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {});
    });

    it("should verify 1024 bit rsa signature correctly", async function () {
        const signature = toCircomBigIntBytes(
            BigInt(
                102386562682221859025549328916727857389789009840935140645361501981959969535413501251999442013082353139290537518086128904993091119534674934202202277050635907008004079788691412782712147797487593510040249832242022835902734939817209358184800954336078838331094308355388211284440290335887813714894626653613586546719n
            )
        );

        const pubkey = toCircomBigIntBytes(
            BigInt(
                106773687078109007595028366084970322147907086635176067918161636756354740353674098686965493426431314019237945536387044259034050617425729739578628872957481830432099721612688699974185290306098360072264136606623400336518126533605711223527682187548332314997606381158951535480830524587400401856271050333371205030999n
            )
        );

        const witness = await circuit.calculateWitness({
            signature: signature,
            modulus: pubkey,
            // TODO: generate this from the input
            message: [
                "1156466847851242602709362303526378170",
                "191372789510123109308037416804949834",
                "7204",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
            ],
        });
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {});
    });

    it("should fail when verifying with an incorrect signature", async function () {
        const emailVerifierInputs = await generateEmailVerifierInputs(
            rawEmail,
            {
                maxHeadersLength: 640,
                maxBodyLength: 768,
            }
        );

        expect.assertions(1);
        try {
            const witness = await circuit.calculateWitness({
                signature: emailVerifierInputs.signature,
                modulus: emailVerifierInputs.pubkey,
                message: [
                    "1156466847851242602709362303526378171",
                    "191372789510123109308037416804949834",
                    "7204",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                    "0",
                ],
            });
            await circuit.checkConstraints(witness);
            await circuit.assertOut(witness, {});
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });
});
