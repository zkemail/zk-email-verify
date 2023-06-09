import assert from "assert";

import * as ScalarN from "../src/scalar.js";

import * as utilsN from "../src/utils.js";

describe("Utils native", () => {
    const num = ScalarN.e("21888242871839275222246405745257275088614511777268538073601725287587578984328");

    it("Should convert integer to buffer little-endian", () => {
        const buff = utilsN.leInt2Buff(num, 32);
        const numFromBuff = utilsN.leBuff2int(buff);

        assert(ScalarN.eq(num, numFromBuff), true);
    });

    it("Should convert integer to buffer big-endian", () => {
        const buff = utilsN.beInt2Buff(num, 32);
        const numFromBuff = utilsN.beBuff2int(buff);

        assert(ScalarN.eq(num, numFromBuff), true);
    });

    it("Should stringify bigInt", () => {
        const str = utilsN.stringifyBigInts(num);
        const numFromStr = utilsN.unstringifyBigInts(str);

        assert(ScalarN.eq(num, numFromStr), true);
    });

    it("Should generate buffer little-endian without trailing non-zero element", () => {
        for (let i = 1; i < 33; i++) {
            var buff = utilsN.leInt2Buff(BigInt(42), i);
            for (let t = 1; t < buff.length; t++){
                assert(buff[t] === 0, true);
            }
        } 
    });

    it("Should generate buffer big-endian without trailing non-zero element", () => {
        for (let i = 1; i < 33; i++) {
            var buff = utilsN.beInt2Buff(BigInt(42), i);
            for (let t = 0; t < buff.length - 1; t++){
                assert(buff[t] === 0, true);
            }
        } 
    });
});