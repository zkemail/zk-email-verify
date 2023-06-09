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


describe("F1 testing", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("Should compute euclidean", () => {
        const F = new F1Field(Scalar.fromString("7"));
        const res = F.inv(F.e(4));

        assert(F.eq(res, F.e(2)));
    });

    it("Should multiply and divide in F1", () => {
        const a = bn128.F1.e("1");
        const b = bn128.F1.e("-1");
        const c = bn128.F1.mul(a,b);
        const d = bn128.F1.div(c,b);

        assert(bn128.F1.eq(a, d));
    });

    it("Should compute sqrts", () => {
        const F = new F1Field(bn128.r);
        const a = F.e("4");
        let b = F.sqrt(a);
        assert(F.eq(F.e(0), F.sqrt(F.e("0"))));
        assert(F.eq(b, F.e("2")));
        // assert(F.sqrt(F.nqr) === null);
    });

    it("Should compute sqrt of 100 random numbers", () => {
        const F = new F1Field(bn128.r);
        for (let j=0;j<100; j++) {
            let a = F.random();
            let s = F.sqrt(a);
            if (s != null) {
                assert(F.eq(F.square(s), a));
            }
        }
    });
});

describe("Curve G1 Test", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("r*one == 0", () => {
        const res = bn128.G1.timesScalar(bn128.G1.g, bn128.r);

        assert(bn128.G1.eq(res, bn128.G1.zero), "G1 does not have range r");
    });

    it("Should add match in various in G1", () => {

        const r1 = bn128.Fr.e(33);
        const r2 = bn128.Fr.e(44);

        const gr1 = bn128.G1.timesFr(bn128.G1.g, r1);
        const gr2 = bn128.G1.timesFr(bn128.G1.g, r2);

        const grsum1 = bn128.G1.add(gr1, gr2);

        const grsum2 = bn128.G1.timesFr(bn128.G1.g, bn128.Fr.add(r1, r2));

        assert(bn128.G1.eq(grsum1, grsum2));
    });
});

describe("Curve G2 Test", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it ("r*one == 0", () => {
        const res = bn128.G2.timesScalar(bn128.G2.g, bn128.r);

        assert(bn128.G2.eq(res, bn128.G2.zero), "G2 does not have range r");
    });

    it("Should add match in various in G2", () => {
        const r1 = bn128.Fr.e(33);
        const r2 = bn128.Fr.e(44);

        const gr1 = bn128.G2.timesFr(bn128.G2.g, r1);
        const gr2 = bn128.G2.timesFr(bn128.G2.g, r2);

        const grsum1 = bn128.G2.add(gr1, gr2);

        const grsum2 = bn128.G2.timesFr(bn128.G2.g, bn128.Fr.add(r1, r2));

        /*
        console.log(G2.toString(grsum1));
        console.log(G2.toString(grsum2));
        */

        assert(bn128.G2.eq(grsum1, grsum2));
    });
});

describe("F6 testing", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("Should multiply and divide in F6", () => {

        const a = bn128.F6.fromObject([
            [Scalar.e("1"), Scalar.e("2")],
            [Scalar.e("3"), Scalar.e("4")],
            [Scalar.e("5"), Scalar.e("6")]
        ]);
        const b = bn128.F6.fromObject([
            [Scalar.e("12"), Scalar.e("11")],
            [Scalar.e("10"), Scalar.e("9")],
            [Scalar.e("8"), Scalar.e("7")]
        ]);
        const c = bn128.F6.mul(a,b);
        const d = bn128.F6.div(c,b);

        assert(bn128.F6.eq(a, d));
    });
});

describe("F12 testing", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("Should multiply and divide in F12", () => {
        const a = bn128.Gt.fromObject([
            [
                [Scalar.e("1"), Scalar.e("2")],
                [Scalar.e("3"), Scalar.e("4")],
                [Scalar.e("5"), Scalar.e("6")]
            ],
            [
                [Scalar.e("7"), Scalar.e("8")],
                [Scalar.e("9"), Scalar.e("10")],
                [Scalar.e("11"), Scalar.e("12")]
            ]
        ]);
        const b = bn128.Gt.fromObject([
            [
                [Scalar.e("12"), Scalar.e("11")],
                [Scalar.e("10"), Scalar.e("9")],
                [Scalar.e("8"), Scalar.e("7")]
            ],
            [
                [Scalar.e("6"), Scalar.e("5")],
                [Scalar.e("4"), Scalar.e("3")],
                [Scalar.e("2"), Scalar.e("1")]
            ]
        ]);
        const c = bn128.F12.mul(a,b);
        const d = bn128.F12.div(c,b);

        assert(bn128.F12.eq(a, d));
    });
});

describe("Pairing", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    /*
    it("Should match pairing", () => {
        for (let i=0; i<1; i++) {
            const bn128 = new BN128();

            const g1a = bn128.G1.mulScalar(bn128.G1.g, 25);
            const g2a = bn128.G2.mulScalar(bn128.G2.g, 30);

            const g1b = bn128.G1.mulScalar(bn128.G1.g, 30);
            const g2b = bn128.G2.mulScalar(bn128.G2.g, 25);

            const pre1a = bn128.prepareG1(g1a);
            const pre2a = bn128.prepareG2(g2a);
            const pre1b = bn128.prepareG1(g1b);
            const pre2b = bn128.prepareG2(g2b);

            const r1 = bn128.millerLoop(pre1a, pre2a);
            const r2 = bn128.millerLoop(pre1b, pre2b);

            const rbe = bn128.F12.mul(r1, bn128.F12.inverse(r2));

            const res = bn128.finalExponentiation(rbe);

            assert(bn128.F12.eq(res, bn128.F12.one));
        }
    })
    */
    it("Should generate another pairing pairing", () => {
        for (let i=0; i<1; i++) {
            const g1a = bn128.G1.timesScalar(bn128.G1.g, 10);
            const g2a = bn128.G2.timesScalar(bn128.G2.g, 1);

            const g1b = bn128.G1.timesScalar(bn128.G1.g, 1);
            const g2b = bn128.G2.timesScalar(bn128.G2.g, 10);

            const pre1a = bn128.prepareG1(g1a);
            const pre2a = bn128.prepareG2(g2a);
            const pre1b = bn128.prepareG1(g1b);
            const pre2b = bn128.prepareG2(g2b);

            const r1 = bn128.millerLoop(pre1a, pre2a);
            const r2 = bn128.finalExponentiation(r1);

            const r3 = bn128.millerLoop(pre1b, pre2b);

            const r4 = bn128.finalExponentiation(r3);

            /*
            console.log("ML1: " ,bn128.F12.toString(r1));
            console.log("FE1: " ,bn128.F12.toString(r2));
            console.log("ML2: " ,bn128.F12.toString(r3));
            console.log("FE2: " ,bn128.F12.toString(r4));
            */

            assert(bn128.F12.eq(r2, r4));


            /*
            const r2 = bn128.millerLoop(pre1b, pre2b);

            const rbe = bn128.F12.mul(r1, bn128.F12.inverse(r2));

            const res = bn128.finalExponentiation(rbe);

            assert(bn128.F12.eq(res, bn128.F12.one));
            */
        }
    });
});

describe("Compressed Form", function() {
    this.timeout(0);

    let bn128;
    before( async() => {
        bn128 = await buildBn128();
    });
    after( async() => {
        bn128.terminate();
    });

    it("Should test rpr of G2", () => {
        const P1 = bn128.G2.fromObject([
            [
                Scalar.e("1b2327ce7815d3358fe89fd8e5695305ed23682db29569f549ab8f48cae1f1c4",16),
                Scalar.e("1ed41ca6b3edc06237af648f845c270ff83bcde333f17863c1b71a43b271b46d",16)
            ],
            [
                Scalar.e("122057912ab892abcf2e729f0f342baea3fe1b484840eb97c7d78cd7530f4ab5",16),
                Scalar.e("2cb317fd40d56eeb17b0c1ff9443661a42ec00cea060012873b3f643f1a5bff8",16)
            ],
            [
                Scalar.one,
                Scalar.zero
            ]
        ]);
        const buff = new Uint8Array(64);
        bn128.G2.toRprCompressed(buff, 0, P1);

        const P2 = bn128.G2.fromRprCompressed(buff, 0);

        /*
        console.log(bn128.G2.toString(P1, 16));
        console.log(bn128.G2.toString(P2, 16));
        */

        assert(bn128.G2.eq(P1,P2));
    });
});
