import * as r1cs from "../src/r1csfile.js";
import path from "path";
import assert from "assert";

const primeStr = "21888242871839275222246405745257275088548364400416034343698204186575808495617";

const expected = {
    "n8": 32,
    "prime": primeStr,
    "useCustomGates": false,
    "nVars": 7,
    "nOutputs": 1,
    "nPubInputs": 2,
    "nPrvInputs": 3,
    "nLabels": 1000,
    "nConstraints": 3,
    "constraints": [
        [
            {
                "5": "3",
                "6": "8"
            },
            {
                "0": "2",
                "2": "20",
                "3": "12"
            },
            {
                "0": "5",
                "2": "7"
            }
        ],[
            {
                "1": "4",
                "4": "8",
                "5": "3"
            },
            {
                "3": "44",
                "6": "6"
            },
            {}
        ],[
            {
                "6": "4"
            },
            {
                "0": "6",
                "2": "11",
                "3": "5"
            },
            {
                "6": "600"
            }
        ]
    ],
    "map": [
        0,
        3,
        10,
        11,
        12,
        15,
        324
    ],
    customGates: [],
    customGatesUses: []
};

export function stringifyBigInts(Fr, o) {
    if ((typeof(o) == "bigint") || o.eq !== undefined)  {
        return o.toString(10);
    } else if (o instanceof Uint8Array) {
        return Fr.toString(o);
    } else if (Array.isArray(o)) {
        return o.map(stringifyBigInts.bind(null, Fr));
    } else if (typeof o == "object") {
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = stringifyBigInts(Fr, o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("Parse R1CS file", function () {
    this.timeout(1000000000);
    it("Parse example file", async () => {
        let cir = await r1cs.readR1cs(path.join("test" , "testutils", "example.r1cs"), true, true);

        const curve = cir.curve;
        delete cir.Fr;
        delete cir.curve;
        delete cir.F;

        cir = stringifyBigInts(curve.Fr, cir);

        assert.deepEqual(cir, expected);

        await curve.terminate();
    });

    it("Parse example file with struct as second parameter", async () => {
        const struct = {loadConstraints: true, loadMap: true};
        let cir = await r1cs.readR1cs(path. join("test" , "testutils", "example.r1cs"), struct);

        const curve = cir.curve;
        delete cir.Fr;
        delete cir.curve;
        delete cir.F;

        cir = stringifyBigInts(curve.Fr, cir);

        assert.deepEqual(cir, expected);

        await curve.terminate();
    });
});
