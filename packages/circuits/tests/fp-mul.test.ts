import { wasm as wasm_tester } from 'circom_tester';
import path from 'path';

describe('FpMul', () => {
    let circuit1: any;
    let circuit2: any;

    beforeAll(async () => {
        circuit1 = await wasm_tester(
            path.join(
                __dirname,
                './test-circuits/fp-mul-test.circom'
            ),
            {
                recompile: true,
                include: path.join(__dirname, '../../../node_modules'),
                output: path.join(__dirname, './compiled-test-circuits'),
            }
        );
        circuit2 = await wasm_tester(
            path.join(
                __dirname,
                './test-circuits/fp-mul-test-range-check.circom'
            ),
            {
                recompile: true,
                include: path.join(__dirname, '../../../node_modules'),
                output: path.join(__dirname, './compiled-test-circuits'),
            }
        );
    });

    it('should correctly match with the output', async () => {
        const input = {
            a: [1, 0, 1, 0],
            b: [0, 1, 1, 0],
            p: [1, 1, 1, 1]
        };

        const witness = await circuit1.calculateWitness(input);
        await circuit1.checkConstraints(witness);

        await circuit1.assertOut(witness, {
            out: [0, 0, 0, 0],
        });
    });

    it('should fail when r exceeds p', async () => {
        const input = {
            a: [4, 0],
            b: [4, 0],
            p: [5, 0],
            q: [2, 0],
            r: [6, 0]
        };

        expect.assertions(1);
        try {
            const witness = await circuit2.calculateWitness(input);
            await circuit2.checkConstraints(witness);
        } catch (error) {
            expect((error as Error).message).toMatch("Assert Failed");
        }
    });

});
