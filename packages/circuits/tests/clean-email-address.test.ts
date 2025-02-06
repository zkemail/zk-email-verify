import { wasm as wasm_tester } from "circom_tester";
import path from "path";

describe("CleanEmailAddress", () => {
    jest.setTimeout(20_1000);

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/clean-email-address-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should correctly clean email with dots and alias", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyas.londhe+alias@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhe@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });

    it("should fail when decoded email is incorrect", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyas.londhe+alias@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhe@yahoo.com", 32), // wrong domain
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 0 });
    });

    it("should handle email with only dots", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyas.londhe@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhe@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });

    it("should handle email with only alias", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyaslondhe+test@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhe@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });

    it("should handle email with multiple dots", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyas.londhe.test@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhetest@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });

    it("should handle email with complex alias", async () => {
        const input = {
            encoded: stringToAsciiArray(
                "shs.loe+test.alias+123@gmail.com",
                32
            ),
            decoded: stringToAsciiArray("shsloe@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });

    it("should handle clean email with no modifications needed", async () => {
        const input = {
            encoded: stringToAsciiArray("shreyaslondhe@gmail.com", 32),
            decoded: stringToAsciiArray("shreyaslondhe@gmail.com", 32),
        };

        const witness = await circuit.calculateWitness(input);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { isValid: 1 });
    });
});

// Helper function to convert string to ASCII array with padding
function stringToAsciiArray(str: string, length: number): number[] {
    const result = new Array(length).fill(0);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
}
