import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("RemoveSoftLineBreaks", () => {
    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/remove-soft-line-breaks-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should correctly remove soft line breaks", async () => {
        const input = {
            encoded: [
                115, 101, 115, 58, 61, 13, 10, 45, 32, 83, 114, 101, 97, 107,
                61, 13, 10,
            ],
            decoded: [115, 101, 115, 58, 45, 32, 83, 114, 101, 97, 107],
            r: 69,
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);

        await circuit.assertOut(witness, {
            is_valid: 1,
        });
    });

    it("should fail when decoded input is incorrect", async () => {
        const input = {
            encoded: [
                115, 101, 115, 58, 61, 13, 10, 45, 32, 83, 114, 101, 97, 107,
                61, 13, 10,
            ],
            decoded: [115, 101, 115, 58, 45, 32, 83, 114, 101, 97, 108], // Changed last character
            r: 69,
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);

        await circuit.assertOut(witness, {
            is_valid: 0,
        });
    });
});
