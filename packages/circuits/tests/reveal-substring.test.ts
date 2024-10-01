import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("RevealSubstring Circuit", () => {
    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/reveal-substring-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should correctly reveal a substring in the middle of the input", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 50,
            substringLength: 5,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual([
            51n,
            52n,
            53n,
            54n,
            55n,
            ...Array(11).fill(0n),
        ]);
    });

    it("should correctly reveal a substring at the start of the input", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 0,
            substringLength: 5,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual([
            1n,
            2n,
            3n,
            4n,
            5n,
            ...Array(11).fill(0n),
        ]);
    });

    it("should correctly reveal a substring at the end of the non-zero input", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 95,
            substringLength: 5,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual([
            96n,
            97n,
            98n,
            99n,
            100n,
            ...Array(11).fill(0n),
        ]);
    });

    it("should correctly reveal a substring of length 1", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 50,
            substringLength: 1,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual([51n, ...Array(15).fill(0n)]);
    });

    it("should correctly reveal the maximum length substring", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 0,
            substringLength: 16,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual(
            Array(16)
                .fill(0)
                .map((_, i) => BigInt(i + 1))
        );
    });

    it("should pad with zeros when substringLength is less than maxSubstringLength", async () => {
        const input = {
            in: [
                ...Array(100)
                    .fill(0)
                    .map((_, i) => (i % 255) + 1),
                ...Array(156).fill(0),
            ],
            substringStartIndex: 0,
            substringLength: 3,
        };
        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        expect(witness.slice(1, 17)).toEqual([
            1n,
            2n,
            3n,
            ...Array(13).fill(0n),
        ]);
    });

    it("should fail when substringStartIndex is equal to maxLength", async () => {
        const input = {
            in: Array(256).fill(1),
            substringStartIndex: 256, // Equal to maxLength
            substringLength: 1,
        };
        await expect(circuit.calculateWitness(input)).rejects.toThrow();
    });

    it("should fail when substringStartIndex is greater than maxLength", async () => {
        const input = {
            in: Array(256).fill(1),
            substringStartIndex: 257, // Greater than maxLength
            substringLength: 1,
        };
        await expect(circuit.calculateWitness(input)).rejects.toThrow();
    });

    it("should fail when substringLength is equal to maxSubstringLength", async () => {
        const input = {
            in: Array(256).fill(1),
            substringStartIndex: 0,
            substringLength: 16, // Equal to maxSubstringLength
        };
        await expect(circuit.calculateWitness(input)).rejects.toThrow();
    });

    it("should fail when substringLength is greater than maxSubstringLength", async () => {
        const input = {
            in: Array(256).fill(1),
            substringStartIndex: 0,
            substringLength: 17, // Greater than maxSubstringLength
        };
        await expect(circuit.calculateWitness(input)).rejects.toThrow();
    });

    it("should fail when substringStartIndex + substringLength is greater than maxLength", async () => {
        const input = {
            in: Array(256).fill(1),
            substringStartIndex: 250,
            substringLength: 7, // 250 + 7 > 256
        };
        await expect(circuit.calculateWitness(input)).rejects.toThrow();
    });
});
