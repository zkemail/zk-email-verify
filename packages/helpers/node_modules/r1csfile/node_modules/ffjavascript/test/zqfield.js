import ZqField from "../src/f1field.js";
import * as Scalar from "../src/scalar.js";
import assert from "assert";

const q = Scalar.fromString("21888242871839275222246405745257275088696311157297823662689037894645226208583");
const r = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");

describe("F1 testing", () => {
    it("Should compute euclidean", () => {
        const F = new ZqField(7);
        const res = F.inv(F.e(4));

        assert(F.eq(res,F.e(2)));
    });

    it("Should multiply and divide in F1", () => {
        const F = new ZqField(q);
        const a = F.e("1");
        const b = F.normalize(-3);
        const c = F.mul(a,b);
        const d = F.div(c,b);

        assert(F.eq(a, d));
    });

    it("Should compute sqrts", () => {
        const F = new ZqField(q);
        const a = F.e("4");
        let b = F.sqrt(a);
        assert(F.eq(F.e(0), F.sqrt(F.e("0"))));
        assert(F.eq(b, F.e("2")));
        assert(F.sqrt(F.nqr) === null);
    });

    it("Should compute sqrt of 100 random numbers", () => {
        const F = new ZqField(r);
        for (let j=0;j<100; j++) {
            let a = F.random();
            let s = F.sqrt(a);
            if (s != null) {
                assert(F.eq(F.square(s), a));
            }
        }
    });
});
