import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("CheckSubstringMatch Circuit", () => {
    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/check-substring-match-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should match when substring is at the beginning", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(27).fill(0)],
            substring: [1, 2, 3, ...Array(29).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(1n);
    });

    it("should not match when substring is different", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(27).fill(0)],
            substring: [1, 2, 4, ...Array(29).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(0n);
    });

    it("should match with full length substring", async () => {
        const input = {
            in: Array(32)
                .fill(0)
                .map((_, i) => i + 1),
            substring: Array(32)
                .fill(0)
                .map((_, i) => i + 1),
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(1n);
    });

    it("should fail when first element of substring is zero", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(27).fill(0)],
            substring: [0, 2, 3, ...Array(29).fill(0)],
        };
        await expect(async () => {
            await circuit.calculateWitness(input);
        }).rejects.toThrow("Assert Failed");
    });

    it("should not match when substring is not at the beginning", async () => {
        const input = {
            in: [9, 1, 2, 3, 4, ...Array(27).fill(0)],
            substring: [1, 2, 3, ...Array(29).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(0n);
    });

    it("should match with single-element substring", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(27).fill(0)],
            substring: [1, ...Array(31).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(1n);
    });

    it("should not match when input is all zeros", async () => {
        const input = {
            in: Array(32).fill(0),
            substring: [1, 2, 3, ...Array(29).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(0n);
    });

    it("should not match when substring is longer than non-zero part of input", async () => {
        const input = {
            in: [1, 2, 3, 4, 5, ...Array(27).fill(0)],
            substring: [1, 2, 3, 4, 5, 6, ...Array(26).fill(0)],
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness[1]).toBe(0n);
    });
});
