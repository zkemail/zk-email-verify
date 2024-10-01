import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("ByteMask Circuit", () => {
    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/byte-mask-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should mask the body correctly", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            mask: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {
            out: [1, 0, 3, 0, 5, 0, 7, 0, 9, 0],
        });
    });

    it("should fail if mask has non-bit numbers", async () => {
        const input = {
            body: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            mask: [1, 2, 1, 0, 1, 0, 1, 0, 1, 0], // Mask with non-bit number (2)
        };

        try {
            const witness = await circuit.calculateWitness(input);
            await circuit.checkConstraints(witness);
            await circuit.assertOut(witness, {
                maskedBody: [1, 0, 3, 0, 5, 0, 7, 0, 9, 0],
            });
        } catch (error) {
            expect(error).toBeTruthy();
        }

        expect.assertions(1);
    });
});
