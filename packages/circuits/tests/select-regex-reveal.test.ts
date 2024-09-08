import { wasm } from "circom_tester";
import path from "path";

describe("Select Regex Reveal", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm(
            path.join(
                __dirname,
                "./test-circuits/select-regex-reveal-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
            }
        );
    });

    it("should reveal the substring with maximum revealed length", async function () {
        let input = new Array(34).fill(0);
        const startIndex = Math.floor(Math.random() * 24);
        const revealed = Array.from("zk email").map((char) =>
            char.charCodeAt(0)
        );
        for (let i = 0; i < revealed.length; i++) {
            input[startIndex + i] = revealed[i];
        }
        const witness = await circuit.calculateWitness({
            in: input,
            startIndex: startIndex,
        });
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, { out: revealed });
    });

    it("should reveal the substring with non-maximum revealed length", async function () {
        let input = new Array(34).fill(0);
        const startIndex = 30;
        const revealed = Array.from("zk").map((char) => char.charCodeAt(0));
        for (let i = 0; i < revealed.length; i++) {
            input[startIndex + i] = revealed[i];
        }
        const witness = await circuit.calculateWitness({
            in: input,
            startIndex: startIndex,
        });
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {
            out: revealed.concat([0, 0, 0, 0, 0, 0]),
        });
    });

    it("should fail when all zero", async function () {
        let input = new Array(34).fill(0);
        const startIndex = Math.floor(Math.random() * 34);
        try {
            const witness = await circuit.calculateWitness({
                in: input,
                startIndex: startIndex,
            });
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }

        expect.assertions(1);
    });

    it("should fail when startIndex is 0", async function () {
        let input = new Array(34).fill(0);
        const startIndex = 1 + Math.floor(Math.random() * 24);
        const revealed = Array.from("zk email").map((char) =>
            char.charCodeAt(0)
        );
        for (let i = 0; i < revealed.length; i++) {
            input[startIndex + i] = revealed[i];
        }
        try {
            const witness = await circuit.calculateWitness({
                in: input,
                startIndex: startIndex - 1,
            });
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }

        expect.assertions(1);
    });

    it("should fail when startIndex is not before 0", async function () {
        let input = new Array(34).fill(0);
        const startIndex = Math.floor(Math.random() * 23);
        const revealed = Array.from("zk email").map((char) =>
            char.charCodeAt(0)
        );
        for (let i = 0; i < revealed.length; i++) {
            input[startIndex + i] = revealed[i];
        }
        try {
            const witness = await circuit.calculateWitness({
                in: input,
                startIndex: startIndex + 1,
            });
            await circuit.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }

        expect.assertions(1);
    });
});
