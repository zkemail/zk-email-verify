import path from "path";
import assert from "assert";
import {readR1cs} from "../src/r1csfile.js";

const cgList = [
    {
        "templateName": "RANGE_CHECK",
        "parameters": [10n, 20n]
    },
    {
        "templateName": "POSEIDON_HASH",
        "parameters": [5n, 6n]
    },
];

const cgUses = [
    {
        "id": 0,
        "signals": [6, 7]
    },
    {
        "id": 0,
        "signals": [8, 9]
    },
    {
        "id": 1,
        "signals": [4, 5, 6]
    },
];

describe("Parse R1CS Custom Gates Sections file", function () {

    it("Parse R1CS Custom Gates example file", async () => {
        let fileName = path.join("test", "testutils", "circuitCG.r1cs");
        const cir = await readR1cs(fileName, {loadCustomGates: true});

        for (let i = 0; i < cir.customGates.length; i++) {
            for (let j = 0; j < cir.customGates[i].parameters.length; j++) {
                cir.customGates[i].parameters[j] = cir.F.toObject(cir.customGates[i].parameters[j]);
            }
        }

        assert.deepEqual(cir.customGates, cgList);
        assert.deepEqual(cir.customGatesUses, cgUses);

        cir.curve.terminate();
    });
});
