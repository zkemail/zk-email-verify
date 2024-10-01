import { wasm as wasm_tester } from "circom_tester";
import path from "path";
import { bigIntToChunkedBytes, Uint8ArrayToCharArray } from "@zk-email/helpers/src/binary-format";


describe("SplitBytesToWords Helper unit test", () => {
    jest.setTimeout(0.1 * 60 * 1000);
    let circuit: any;

    beforeAll(async () => {
        circuit = await wasm_tester(
            path.join(__dirname, "./test-circuits/split-bytes-to-words-test.circom"),
            {
                recompile: true,
                include: path.join(__dirname, "../../../node_modules"),
                // output: path.join(__dirname, "./compiled-test-circuits"),
            }
        );

    });

    it("should split correctly according to bigIntToChunkedBytes function", async function () {
        const bytes = new Uint8Array(256).map(() => Math.floor(Math.random() * 256));
        const bytesBigInt = bytes.reduce((acc, val) => (acc << 8n) | BigInt(val), 0n);
        const ts_split_to_words = bigIntToChunkedBytes(bytesBigInt, 121, 17);
        const ts_split_to_words_bigint = ts_split_to_words.map((word) => BigInt(word));
        const witness = await circuit.calculateWitness({
            in: Uint8ArrayToCharArray(bytes)
        });
        await circuit.assertOut(witness, { out: ts_split_to_words_bigint });
    });

});
