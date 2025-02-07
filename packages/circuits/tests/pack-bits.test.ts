import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { shaHash } from "@zk-email/helpers/src/sha-utils";

describe("PackBits", () => {
    jest.setTimeout(30 * 60 * 1000);

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/pack-bits-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should pack 256 bits into 2x128 bits correctly", async () => {
        // Generate test data using SHA256
        const hash = shaHash(Buffer.from("test data", "ascii"));
        // Convert to BE bits
        const bits = Array.from(hash).flatMap((byte) =>
            Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1)
        );

        const witness = await circuit.calculateWitness({
            in: bits,
        });

        // Calculate expected values (BE)
        let expectedHi = 0n;
        let expectedLo = 0n;

        for (let i = 0; i < 128; i++) {
            expectedHi += BigInt(bits[i]) << BigInt(127 - i);
            expectedLo += BigInt(bits[i + 128]) << BigInt(127 - i);
        }

        await circuit.assertOut(witness, {
            out: [expectedHi, expectedLo],
        });
    });

    it("should handle zero input correctly", async () => {
        const input = Array(256).fill(0);

        const witness = await circuit.calculateWitness({
            in: input,
        });

        await circuit.assertOut(witness, {
            out: [0, 0],
        });
    });

    it("should handle all ones correctly", async () => {
        const input = Array(256).fill(1);

        const witness = await circuit.calculateWitness({
            in: input,
        });

        // Calculate max values for 128 bits (same in BE and LE)
        const max128 = (1n << 128n) - 1n;

        await circuit.assertOut(witness, {
            out: [max128, max128],
        });
    });
});

describe("PackBits 10->4x3", () => {
    jest.setTimeout(30 * 60 * 1000);

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/pack-bits-10.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should pack 10 bits into 3-bit chunks correctly", async () => {
        // Input in BE: [1,1,0] [1,0,1] [1,0,1] [1]
        const input = [1, 1, 0, 1, 0, 1, 1, 0, 1, 1];

        const witness = await circuit.calculateWitness({
            in: input,
        });

        // Expected values in BE:
        // First chunk (bits 0-2): 110 = 6
        // Second chunk (bits 3-5): 101 = 5
        // Third chunk (bits 6-8): 101 = 5
        // Fourth chunk (bits 9): 100 = 4 (padded with zeros)
        await circuit.assertOut(witness, {
            out: [6, 5, 5, 4],
        });
    });
});
