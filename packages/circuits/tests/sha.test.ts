import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { sha256Pad, shaHash } from "@zk-email/helpers/src/sha-utils";
import {
    Uint8ArrayToCharArray,
    uint8ToBits,
} from "@zk-email/helpers/src/binary-format";

describe("SHA256 for email header", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/sha-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                // output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should hash correctly", async function () {
        const inputs = ["0", "hello world", ""];
        for (const input of inputs) {
            const [paddedMsg, messageLen] = sha256Pad(
                Buffer.from(input, "ascii"),
                640
            );

            const witness = await circuit.calculateWitness({
                paddedIn: Uint8ArrayToCharArray(paddedMsg),
                paddedInLength: messageLen,
            });

            await circuit.checkConstraints(witness);
            await circuit.assertOut(witness, {
                out: [...uint8ToBits(shaHash(Buffer.from(input, "ascii")))],
            });
        }
    });
});
