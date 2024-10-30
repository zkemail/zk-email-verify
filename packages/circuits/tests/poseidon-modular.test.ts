import path from "path";
import { wasm as wasm_tester } from "circom_tester";
import { poseidonModular } from "@zk-email/helpers/src/hash";

describe("PoseidonModular", () => {
    jest.setTimeout(30 * 60 * 1000); // 30 minutes

    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(
                __dirname,
                "./test-circuits/poseidon-modular-test.circom"
            ),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );
    });

    it("should hash correctly", async function () {
        const inputs = Array.from({ length: 37 }, () =>
            BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        );
        const hash = await poseidonModular(inputs);

        const witness = await circuit.calculateWitness({
            in: inputs,
        });
        await circuit.checkConstraints(witness);

        expect(witness[1]).toEqual(hash);
    });
});
