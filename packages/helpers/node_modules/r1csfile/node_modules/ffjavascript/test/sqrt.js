/*
    Copyright 2018 0kims association.

    This file is part of zksnark JavaScript library.

    zksnark JavaScript library is a free software: you can redistribute it and/or
    modify it under the terms of the GNU General Public License as published by the
    Free Software Foundation, either version 3 of the License, or (at your option)
    any later version.

    zksnark JavaScript library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
    more details.

    You should have received a copy of the GNU General Public License along with
    zksnark JavaScript library. If not, see <https://www.gnu.org/licenses/>.
*/

import chai from "chai";

import * as Scalar from "../src/scalar.js";
import buildBn128 from "../src/bn128.js";
import F1Field from "../src/f1field.js";

const assert = chai.assert;


describe("Sqrt testing", () => {
    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    /*
    it("Should compute sqrts", () => {
        const F = new F1Field(bn128.r);
        const a = F.e(2);
        const b = F.sqrt_v(a);
        console.log(F.toString(b));
    });
    */
    it("Should compute basic sqrts", () => {
        const F = new F1Field(bn128.r);
        assert(F.eq(F.e(0), F.sqrt(F.e("0"))));
        const a = F.e("9");
        let b = F.sqrt(a);
        assert(F.eq(b, F.e("3")));
        assert(F.sqrt(F.sqrt_z) === null);
    });
    it("Should compute sqrt p%4 = 1", () => {
        const F = new F1Field(bn128.r);
        const e = Scalar.div(Scalar.pow(F.p, F.m), 2);
        for (let i=0; i<100; i++) {
            const x2 = F.random();
            const x = F.sqrt(x2);
            if (x==null) {
                assert(F.eq( F.pow(x2, e), F.negone));
            } else {
                assert(F.eq(F.square(x), x2));
            }
        }
    });
    it("Should compute sqrt p%4 = 3", () => {
        const F = new F1Field(bn128.q);
        const e = Scalar.div(Scalar.pow(F.p, F.m), 2);
        for (let i=0; i<100; i++) {
            const x2 = F.random();
            const x = F.sqrt(x2);
            if (x==null) {
                assert(F.eq( F.pow(x2, e), F.negone));
            } else {
                assert(F.eq(F.square(x), x2));
            }
        }
    });
    it("Should compute sqrt m=2 p%4 = 3", () => {
        const F = bn128.F2;
        const e = Scalar.div(Scalar.exp(F.F.p, F.m), 2);
        for (let i=0; i<100; i++) {
            const x2 = F.random();
            if (!F.isSquare(x2)) {
                assert(F.eq( F.exp(x2, e), F.negone));
            } else {
                const x = F.sqrt(x2);
                assert(F.eq(F.square(x), x2));
            }
        }
    });

});

