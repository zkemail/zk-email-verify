import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("CountSubstringOccurrences Circuit", () => {
    jest.setTimeout(10 * 60 * 1000); // 10 minutes

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/count-substring-occurrences-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should count single occurrence at the beginning", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(1019).fill(0)],
            substring: [1, 2, 3, ...Array(125).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(1n);
    });

    it("should count multiple occurrences", async () => {
        const input = {
            in: [1, 2, 3, 4, 1, 2, 3, 5, 1, 2, 3, ...Array(1013).fill(0)],
            substring: [1, 2, 3, ...Array(125).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(3n);
    });

    it("should return 0 for no occurrences", async () => {
        const input = {
            in: [1, 2, 4, 5, 6, ...Array(1019).fill(0)],
            substring: [1, 2, 3, ...Array(125).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(0n);
    });

    it("should count occurrences with overlap", async () => {
        const input = {
            in: [1, 1, 1, 2, 1, 1, ...Array(1018).fill(0)],
            substring: [1, 1, ...Array(126).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(3n);
    });

    it("should handle full match of input", async () => {
        const repeatedPattern = [1, 2, 3, 4];
        const input = {
            in: Array(256)
                .fill(repeatedPattern)
                .flat()
                .concat(Array(1024 - 256 * 4).fill(0)),
            substring: [1, 2, 3, 4, ...Array(124).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(256n);
    });

    it("should handle single character substring", async () => {
        const input = {
            in: [1, 2, 1, 3, 1, 4, 1, ...Array(1017).fill(0)],
            substring: [1, ...Array(127).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(4n);
    });

    it("should handle substring at the end of input", async () => {
        const input = {
            in: [...Array(1021).fill(0), 1, 2, 3],
            substring: [1, 2, 3, ...Array(125).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(1n);
    });

    it("should return 0 for empty substring", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(1019).fill(0)],
            substring: Array(128).fill(0),
        };
        await expect(async () => {
            await circuit.calculateWitness(input);
        }).rejects.toThrow("Assert Failed");
    });
});
