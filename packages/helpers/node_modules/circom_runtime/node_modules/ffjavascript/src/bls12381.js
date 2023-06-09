import { buildBls12381 as buildBls12381wasm } from "wasmcurves";
import buildEngine from "./engine.js";
import * as Scalar from "./scalar.js";
import { ModuleBuilder } from "wasmbuilder";

globalThis.curve_bls12381 = null;

export default async function buildBls12381(singleThread, plugins) {

    const moduleBuilder = new ModuleBuilder();
    moduleBuilder.setMemory(25);
    buildBls12381wasm(moduleBuilder);

    if (plugins) plugins(moduleBuilder);

    const bls12381wasm = {};

    bls12381wasm.code = moduleBuilder.build();
    bls12381wasm.pq = moduleBuilder.modules.f1m.pq;
    bls12381wasm.pr = moduleBuilder.modules.frm.pq;
    bls12381wasm.pG1gen = moduleBuilder.modules.bls12381.pG1gen;
    bls12381wasm.pG1zero = moduleBuilder.modules.bls12381.pG1zero;
    bls12381wasm.pG1b = moduleBuilder.modules.bls12381.pG1b;
    bls12381wasm.pG2gen = moduleBuilder.modules.bls12381.pG2gen;
    bls12381wasm.pG2zero = moduleBuilder.modules.bls12381.pG2zero;
    bls12381wasm.pG2b = moduleBuilder.modules.bls12381.pG2b;
    bls12381wasm.pOneT = moduleBuilder.modules.bls12381.pOneT;
    bls12381wasm.prePSize = moduleBuilder.modules.bls12381.prePSize;
    bls12381wasm.preQSize = moduleBuilder.modules.bls12381.preQSize;
    bls12381wasm.n8q = 48;
    bls12381wasm.n8r = 32;
    bls12381wasm.q = moduleBuilder.modules.bls12381.q;
    bls12381wasm.r = moduleBuilder.modules.bls12381.r;


    if ((!singleThread) && (globalThis.curve_bls12381)) return globalThis.curve_bls12381;
    const params = {
        name: "bls12381",
        wasm: bls12381wasm,
        q: Scalar.e("1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab", 16),
        r: Scalar.e("73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001", 16),
        n8q: 48,
        n8r: 32,
        cofactorG1: Scalar.e("0x396c8c005555e1568c00aaab0000aaab", 16),
        cofactorG2: Scalar.e("0x5d543a95414e7f1091d50792876a202cd91de4547085abaa68a205b2e5a7ddfa628f1cb4d9e82ef21537e293a6691ae1616ec6e786f0c70cf1c38e31c7238e5", 16),
        singleThread: singleThread ? true : false
    };

    const curve = await buildEngine(params);
    curve.terminate = async function () {
        if (!params.singleThread) {
            globalThis.curve_bls12381 = null;
            await this.tm.terminate();
        }
    };

    if (!singleThread) {
        globalThis.curve_bls12381 = curve;
    }

    return curve;
}

