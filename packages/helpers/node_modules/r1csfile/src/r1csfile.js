import {F1Field, getCurveFromR} from "ffjavascript";
import  BigArray from "@iden3/bigarray";
import * as binFileUtils from "@iden3/binfileutils";

export const R1CS_FILE_HEADER_SECTION = 1;
export const R1CS_FILE_CONSTRAINTS_SECTION = 2;
export const R1CS_FILE_WIRE2LABELID_SECTION = 3;
export const R1CS_FILE_CUSTOM_GATES_LIST_SECTION = 4;
export const R1CS_FILE_CUSTOM_GATES_USES_SECTION = 5;

export async function readR1csHeader(fd,sections,singleThread) {
    let options;
    if (typeof singleThread === "object") {
        options = singleThread;
    } else if (typeof singleThread === "undefined") {
        options= {
            singleThread: false,
        };
    } else {
        options = {
            singleThread: singleThread,
        };
    }

    const res = {};
    await binFileUtils.startReadUniqueSection(fd, sections, 1);
    // Read Header
    res.n8 = await fd.readULE32();
    res.prime = await binFileUtils.readBigInt(fd, res.n8);

    if (options.F) {
        if (options.F.p != res.prime) throw new Error("Different Prime");
        res.F = options.F;
    } else if (options.getFieldFromPrime) {
        res.F = await options.getFieldFromPrime(res.prime, options.singleThread);
    } else if (options.getCurveFromPrime) {
        res.curve = await options.getCurveFromPrime(res.prime, options.singleThread);
        res.F = res.curve.Fr;
    } else {
        try {
            res.curve = await getCurveFromR(res.prime, options.singleThread);
            res.F = res.curve.Fr;
        } catch (err) {
            res.F = new F1Field(res.prime);
        }
    }

    res.nVars = await fd.readULE32();
    res.nOutputs = await fd.readULE32();
    res.nPubInputs = await fd.readULE32();
    res.nPrvInputs = await fd.readULE32();
    res.nLabels = await fd.readULE64();
    res.nConstraints = await fd.readULE32();
    res.useCustomGates = typeof sections[R1CS_FILE_CUSTOM_GATES_LIST_SECTION] !== "undefined" && sections[R1CS_FILE_CUSTOM_GATES_LIST_SECTION] !== null
        && typeof sections[R1CS_FILE_CUSTOM_GATES_USES_SECTION] !== "undefined" && sections[R1CS_FILE_CUSTOM_GATES_USES_SECTION] !== null;

    await binFileUtils.endReadSection(fd);

    return res;
}

export async function readConstraints(fd,sections, r1cs, logger, loggerCtx) {
    let options;
    if (typeof logger === "object") {
        options = logger;
    } else if (typeof logger === "undefined") {
        options= {};
    } else {
        options = {
            logger: logger,
            loggerCtx: loggerCtx,
        };
    }

    const bR1cs = await binFileUtils.readSection(fd, sections, 2);
    let bR1csPos = 0;
    let constraints;
    if (r1cs.nConstraints>1<<20) {
        constraints = new BigArray();
    } else {
        constraints = [];
    }
    for (let i=0; i<r1cs.nConstraints; i++) {
        if ((options.logger)&&(i%100000 == 0)) options.logger.info(`${options.loggerCtx}: Loading constraints: ${i}/${r1cs.nConstraints}`);
        const c = readConstraint();
        constraints.push(c);
    }
    return constraints;


    function readConstraint() {
        const c = [];
        c[0] = readLC();
        c[1] = readLC();
        c[2] = readLC();
        return c;
    }

    function readLC() {
        const lc= {};

        const buffUL32 = bR1cs.slice(bR1csPos, bR1csPos+4);
        bR1csPos += 4;
        const buffUL32V = new DataView(buffUL32.buffer);
        const nIdx = buffUL32V.getUint32(0, true);

        const buff = bR1cs.slice(bR1csPos, bR1csPos + (4+r1cs.n8)*nIdx );
        bR1csPos += (4+r1cs.n8)*nIdx;
        const buffV = new DataView(buff.buffer);
        for (let i=0; i<nIdx; i++) {
            const idx = buffV.getUint32(i*(4+r1cs.n8), true);
            const val = r1cs.F.fromRprLE(buff, i*(4+r1cs.n8)+4);
            lc[idx] = val;
        }
        return lc;
    }
}

export async function readMap(fd, sections, r1cs, logger, loggerCtx) {
    let options;
    if (typeof logger === "object") {
        options = logger;
    } else if (typeof logger === "undefined") {
        options= {};
    } else {
        options = {
            logger: logger,
            loggerCtx: loggerCtx,
        };
    }
    const bMap = await binFileUtils.readSection(fd, sections, 3);
    let bMapPos = 0;
    let map;

    if (r1cs.nVars>1<<20) {
        map = new BigArray();
    } else {
        map = [];
    }
    for (let i=0; i<r1cs.nVars; i++) {
        if ((options.logger)&&(i%10000 == 0)) options.logger.info(`${options.loggerCtx}: Loading map: ${i}/${r1cs.nVars}`);
        const idx = readULE64();
        map.push(idx);
    }

    return map;

    function readULE64() {
        const buffULE64 = bMap.slice(bMapPos, bMapPos+8);
        bMapPos += 8;
        const buffULE64V = new DataView(buffULE64.buffer);
        const LSB = buffULE64V.getUint32(0, true);
        const MSB = buffULE64V.getUint32(4, true);

        return MSB * 0x100000000 + LSB;
    }

}

export async function readR1csFd(fd, sections, options) {
    /**
     * Options properties:
     *  loadConstraints: <bool> true by default
     *  loadMap:         <bool> false by default
     *  loadCustomGates: <bool> true by default
     */

    if(typeof options !== "object") {
        throw new Error("readR1csFd: options must be an object");
    }

    options.loadConstraints = "loadConstraints" in options ? options.loadConstraints : true;
    options.loadMap = "loadMap" in options ? options.loadMap : false;
    options.loadCustomGates = "loadCustomGates" in options ? options.loadCustomGates : true;

    const res = await readR1csHeader(fd, sections, options);

    if (options.loadConstraints) {
        res.constraints = await readConstraints(fd, sections, res, options);
    }

    // Read Labels

    if (options.loadMap) {
        res.map = await readMap(fd, sections, res, options);
    }

    if (options.loadCustomGates) {
        if (res.useCustomGates) {
            res.customGates = await readCustomGatesListSection(fd, sections, res);
            res.customGatesUses = await readCustomGatesUsesSection(fd, sections, options);
        } else {
            res.customGates = [];
            res.customGatesUses = [];
        }
    }
    return res;
}

export async function readR1cs(fileName, loadConstraints, loadMap, singleThread, logger, loggerCtx) {
    let options;
    if (typeof loadConstraints === "object") {
        options = loadConstraints;
    } else if (typeof loadConstraints === "undefined") {
        options= {
            loadConstraints: true,
            loadMap: false,
            loadCustomGates: true
        };
    } else {
        options = {
            loadConstraints: loadConstraints,
            loadMap: loadMap,
            singleThread: singleThread,
            logger: logger,
            loggerCtx: loggerCtx
        };
    }

    const {fd, sections} = await binFileUtils.readBinFile(fileName, "r1cs", 1, 1<<25, 1<<22);

    const res = await readR1csFd(fd, sections, options);

    await fd.close();

    return res;
}

export async function readCustomGatesListSection(fd, sections, res) {
    await binFileUtils.startReadUniqueSection(fd, sections, R1CS_FILE_CUSTOM_GATES_LIST_SECTION);

    let num = await fd.readULE32();

    let customGates = [];
    for (let i = 0; i < num; i++) {
        let customGate = {};
        customGate.templateName = await fd.readString();
        let numParameters = await fd.readULE32();

        customGate.parameters = Array(numParameters);
        let buff = await fd.read(res.n8 * numParameters);

        for (let j = 0; j < numParameters; j++) {
            customGate.parameters[j] = res.F.fromRprLE(buff, j * res.n8, res.n8);;
        }
        customGates.push(customGate);
    }
    await binFileUtils.endReadSection(fd);

    return customGates;
}

export async function readCustomGatesUsesSection(fd,sections, options) {
    const bR1cs = await binFileUtils.readSection(fd, sections, R1CS_FILE_CUSTOM_GATES_USES_SECTION);
    const bR1cs32 = new Uint32Array(bR1cs.buffer, bR1cs.byteOffset, bR1cs.byteLength/4);
    const nCustomGateUses = bR1cs32[0];
    let bR1csPos = 1;
    let customGatesUses;
    if (nCustomGateUses>1<<20) {
        customGatesUses = new BigArray();
    } else {
        customGatesUses = [];
    }
    for (let i=0; i<nCustomGateUses; i++) {
        if ((options.logger)&&(i%100000 == 0)) options.logger.info(`${options.loggerCtx}: Loading custom gate uses: ${i}/${nCustomGateUses}`);
        let c = {};
        c.id = bR1cs32[bR1csPos++];
        let numSignals = bR1cs32[bR1csPos++];
        c.signals = [];
        for (let j = 0; j < numSignals; j++) {
            const LSB = bR1cs32[bR1csPos++];
            const MSB = bR1cs32[bR1csPos++];
            c.signals.push(MSB * 0x100000000 + LSB);
        }
        customGatesUses.push(c);
    }
    return customGatesUses;
}

export async function writeR1csHeader(fd, cir) {
    await binFileUtils.startWriteSection(fd, 1);
    await fd.writeULE32(cir.n8); // Temporally set to 0 length
    await binFileUtils.writeBigInt(fd, cir.prime, cir.n8);

    await fd.writeULE32(cir.nVars);
    await fd.writeULE32(cir.nOutputs);
    await fd.writeULE32(cir.nPubInputs);
    await fd.writeULE32(cir.nPrvInputs);
    await fd.writeULE64(cir.nLabels);
    await fd.writeULE32(cir.constraints.length);

    await binFileUtils.endWriteSection(fd);
}

export async function writeR1csConstraints(fd, cir, logger, loggerCtx) {
    await binFileUtils.startWriteSection(fd, 2);

    for (let i=0; i<cir.constraints.length; i++) {
        if ((logger)&&(i%10000 == 0)) logger.info(`${loggerCtx}: writing constraint: ${i}/${cir.constraints.length}`);
        await writeConstraint(cir.constraints[i]);
    }

    await binFileUtils.endWriteSection(fd);


    function writeConstraint(c) {
        const n8 = cir.n8;
        const F = cir.F || cir.curve.Fr;
        const idxA = Object.keys(c[0]);
        const idxB = Object.keys(c[1]);
        const idxC = Object.keys(c[2]);
        const buff = new Uint8Array((idxA.length+idxB.length+idxC.length)*(n8+4) + 12);
        const buffV = new DataView(buff.buffer);
        let o=0;

        buffV.setUint32(o, idxA.length, true); o+=4;
        for (let i=0; i<idxA.length; i++) {
            const coef = idxA[i];
            buffV.setUint32(o, coef, true); o+=4;
            F.toRprLE(buff, o, c[0][coef]); o+=n8;
        }

        buffV.setUint32(o, idxB.length, true); o+=4;
        for (let i=0; i<idxB.length; i++) {
            const coef = idxB[i];
            buffV.setUint32(o, coef, true); o+=4;
            F.toRprLE(buff, o, c[1][coef]); o+=n8;
        }

        buffV.setUint32(o, idxC.length, true); o+=4;
        for (let i=0; i<idxC.length; i++) {
            const coef = idxC[i];
            buffV.setUint32(o, coef, true); o+=4;
            F.toRprLE(buff, o, c[2][coef]); o+=n8;
        }

        return fd.write(buff);
    }

}


export async function writeR1csMap(fd, cir, logger, loggerCtx) {
    await binFileUtils.startWriteSection(fd, 3);

    if (cir.map.length != cir.nVars) throw new Error("Invalid map size");
    for (let i=0; i<cir.nVars; i++) {
        if ((logger)&&(i%10000 == 0)) logger.info(`${loggerCtx}: writing map: ${i}/${cir.nVars}`);
        await fd.writeULE64(cir.map[i]);
    }

    await binFileUtils.endWriteSection(fd);
}



export async function writeR1cs(fileName, cir, logger, loggerCtx) {

    const fd = await binFileUtils.createBinFile(fileName, "r1cs", 1, 3, 1<<25, 1<<22);

    await writeR1csHeader(fd, cir);

    await writeR1csConstraints(fd, cir, logger, loggerCtx);

    await writeR1csMap(fd, cir, logger, loggerCtx);

    await fd.close();
}
