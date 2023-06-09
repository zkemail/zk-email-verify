import {log2, buffReverseBits, array2buffer, buffer2array} from "./utils.js";
import BigBuffer from "./bigbuffer.js";


export default function buildFFT(curve, groupName) {
    const G = curve[groupName];
    const Fr = curve.Fr;
    const tm = G.tm;
    async function _fft(buff, inverse, inType, outType, logger, loggerTxt) {

        inType = inType || "affine";
        outType = outType || "affine";
        const MAX_BITS_THREAD = 14;

        let sIn, sMid, sOut, fnIn2Mid, fnMid2Out, fnFFTMix, fnFFTJoin, fnFFTFinal;
        if (groupName == "G1") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
                fnIn2Mid = "g1m_batchToJacobian";
            } else {
                sIn = G.F.n8*3;
            }
            sMid = G.F.n8*3;
            if (inverse) {
                fnFFTFinal = "g1m_fftFinal";
            }
            fnFFTJoin = "g1m_fftJoin";
            fnFFTMix = "g1m_fftMix";

            if (outType == "affine") {
                sOut = G.F.n8*2;
                fnMid2Out = "g1m_batchToAffine";
            } else {
                sOut = G.F.n8*3;
            }

        } else if (groupName == "G2") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
                fnIn2Mid = "g2m_batchToJacobian";
            } else {
                sIn = G.F.n8*3;
            }
            sMid = G.F.n8*3;
            if (inverse) {
                fnFFTFinal = "g2m_fftFinal";
            }
            fnFFTJoin = "g2m_fftJoin";
            fnFFTMix = "g2m_fftMix";
            if (outType == "affine") {
                sOut = G.F.n8*2;
                fnMid2Out = "g2m_batchToAffine";
            } else {
                sOut = G.F.n8*3;
            }
        } else if (groupName == "Fr") {
            sIn = G.n8;
            sMid = G.n8;
            sOut = G.n8;
            if (inverse) {
                fnFFTFinal = "frm_fftFinal";
            }
            fnFFTMix = "frm_fftMix";
            fnFFTJoin = "frm_fftJoin";
        }


        let returnArray = false;
        if (Array.isArray(buff)) {
            buff = array2buffer(buff, sIn);
            returnArray = true;
        } else {
            buff = buff.slice(0, buff.byteLength);
        }

        const nPoints = buff.byteLength / sIn;
        const bits = log2(nPoints);

        if  ((1 << bits) != nPoints) {
            throw new Error("fft must be multiple of 2" );
        }

        if (bits == Fr.s +1) {
            let buffOut;

            if (inverse) {
                buffOut =  await _fftExtInv(buff, inType, outType, logger, loggerTxt);
            } else {
                buffOut =  await _fftExt(buff, inType, outType, logger, loggerTxt);
            }

            if (returnArray) {
                return buffer2array(buffOut, sOut);
            } else {
                return buffOut;
            }
        }

        let inv;
        if (inverse) {
            inv = Fr.inv(Fr.e(nPoints));
        }

        let buffOut;

        buffReverseBits(buff, sIn);

        let chunks;
        let pointsInChunk = Math.min(1 << MAX_BITS_THREAD, nPoints);
        let nChunks = nPoints / pointsInChunk;

        while ((nChunks < tm.concurrency)&&(pointsInChunk>=16)) {
            nChunks *= 2;
            pointsInChunk /= 2;
        }

        const l2Chunk = log2(pointsInChunk);

        const promises = [];
        for (let i = 0; i< nChunks; i++) {
            if (logger) logger.debug(`${loggerTxt}: fft ${bits} mix start: ${i}/${nChunks}`);
            const task = [];
            task.push({cmd: "ALLOC", var: 0, len: sMid*pointsInChunk});
            const buffChunk = buff.slice( (pointsInChunk * i)*sIn, (pointsInChunk * (i+1))*sIn);
            task.push({cmd: "SET", var: 0, buff: buffChunk});
            if (fnIn2Mid) {
                task.push({cmd: "CALL", fnName:fnIn2Mid, params: [{var:0}, {val: pointsInChunk}, {var: 0}]});
            }
            for (let j=1; j<=l2Chunk;j++) {
                task.push({cmd: "CALL", fnName:fnFFTMix, params: [{var:0}, {val: pointsInChunk}, {val: j}]});
            }

            if (l2Chunk==bits) {
                if (fnFFTFinal) {
                    task.push({cmd: "ALLOCSET", var: 1, buff: inv});
                    task.push({cmd: "CALL", fnName: fnFFTFinal,  params:[
                        {var: 0},
                        {val: pointsInChunk},
                        {var: 1},
                    ]});
                }
                if (fnMid2Out) {
                    task.push({cmd: "CALL", fnName:fnMid2Out, params: [{var:0}, {val: pointsInChunk}, {var: 0}]});
                }
                task.push({cmd: "GET", out: 0, var: 0, len: pointsInChunk*sOut});
            } else {
                task.push({cmd: "GET", out:0, var: 0, len: sMid*pointsInChunk});
            }
            promises.push(tm.queueAction(task).then( (r) => {
                if (logger) logger.debug(`${loggerTxt}: fft ${bits} mix end: ${i}/${nChunks}`);
                return r;
            }));
        }

        chunks = await Promise.all(promises);
        for (let i = 0; i< nChunks; i++) chunks[i] = chunks[i][0];

        for (let i = l2Chunk+1;   i<=bits; i++) {
            if (logger) logger.debug(`${loggerTxt}: fft  ${bits}  join: ${i}/${bits}`);
            const nGroups = 1 << (bits - i);
            const nChunksPerGroup = nChunks / nGroups;
            const opPromises = [];
            for (let j=0; j<nGroups; j++) {
                for (let k=0; k <nChunksPerGroup/2; k++) {
                    const first = Fr.exp( Fr.w[i], k*pointsInChunk);
                    const inc = Fr.w[i];
                    const o1 = j*nChunksPerGroup + k;
                    const o2 = j*nChunksPerGroup + k + nChunksPerGroup/2;

                    const task = [];
                    task.push({cmd: "ALLOCSET", var: 0, buff: chunks[o1]});
                    task.push({cmd: "ALLOCSET", var: 1, buff: chunks[o2]});
                    task.push({cmd: "ALLOCSET", var: 2, buff: first});
                    task.push({cmd: "ALLOCSET", var: 3, buff: inc});
                    task.push({cmd: "CALL", fnName: fnFFTJoin,  params:[
                        {var: 0},
                        {var: 1},
                        {val: pointsInChunk},
                        {var: 2},
                        {var: 3}
                    ]});
                    if (i==bits) {
                        if (fnFFTFinal) {
                            task.push({cmd: "ALLOCSET", var: 4, buff: inv});
                            task.push({cmd: "CALL", fnName: fnFFTFinal,  params:[
                                {var: 0},
                                {val: pointsInChunk},
                                {var: 4},
                            ]});
                            task.push({cmd: "CALL", fnName: fnFFTFinal,  params:[
                                {var: 1},
                                {val: pointsInChunk},
                                {var: 4},
                            ]});
                        }
                        if (fnMid2Out) {
                            task.push({cmd: "CALL", fnName:fnMid2Out, params: [{var:0}, {val: pointsInChunk}, {var: 0}]});
                            task.push({cmd: "CALL", fnName:fnMid2Out, params: [{var:1}, {val: pointsInChunk}, {var: 1}]});
                        }
                        task.push({cmd: "GET", out: 0, var: 0, len: pointsInChunk*sOut});
                        task.push({cmd: "GET", out: 1, var: 1, len: pointsInChunk*sOut});
                    } else {
                        task.push({cmd: "GET", out: 0, var: 0, len: pointsInChunk*sMid});
                        task.push({cmd: "GET", out: 1, var: 1, len: pointsInChunk*sMid});
                    }
                    opPromises.push(tm.queueAction(task).then( (r) => {
                        if (logger) logger.debug(`${loggerTxt}: fft ${bits} join  ${i}/${bits}  ${j+1}/${nGroups} ${k}/${nChunksPerGroup/2}`);
                        return r;
                    }));
                }
            }

            const res = await Promise.all(opPromises);
            for (let j=0; j<nGroups; j++) {
                for (let k=0; k <nChunksPerGroup/2; k++) {
                    const o1 = j*nChunksPerGroup + k;
                    const o2 = j*nChunksPerGroup + k + nChunksPerGroup/2;
                    const resChunk = res.shift();
                    chunks[o1] = resChunk[0];
                    chunks[o2] = resChunk[1];
                }
            }
        }

        if (buff instanceof BigBuffer) {
            buffOut = new BigBuffer(nPoints*sOut);
        } else {
            buffOut = new Uint8Array(nPoints*sOut);
        }
        if (inverse) {
            buffOut.set(chunks[0].slice((pointsInChunk-1)*sOut));
            let p= sOut;
            for (let i=nChunks-1; i>0; i--) {
                buffOut.set(chunks[i], p);
                p += pointsInChunk*sOut;
                delete chunks[i];  // Liberate mem
            }
            buffOut.set(chunks[0].slice(0, (pointsInChunk-1)*sOut), p);
            delete chunks[0];
        } else {
            for (let i=0; i<nChunks; i++) {
                buffOut.set(chunks[i], pointsInChunk*sOut*i);
                delete chunks[i];
            }
        }

        if (returnArray) {
            return buffer2array(buffOut, sOut);
        } else {
            return buffOut;
        }
    }

    async function _fftExt(buff, inType, outType, logger, loggerTxt) {
        let b1, b2;
        b1 = buff.slice( 0 , buff.byteLength/2);
        b2 = buff.slice( buff.byteLength/2, buff.byteLength);

        const promises = [];

        [b1, b2] = await _fftJoinExt(b1, b2, "fftJoinExt", Fr.one, Fr.shift, inType, "jacobian", logger, loggerTxt);

        promises.push( _fft(b1, false, "jacobian", outType, logger, loggerTxt));
        promises.push( _fft(b2, false, "jacobian", outType, logger, loggerTxt));

        const res1 = await Promise.all(promises);

        let buffOut;
        if (res1[0].byteLength > (1<<28)) {
            buffOut = new BigBuffer(res1[0].byteLength*2);
        } else {
            buffOut = new Uint8Array(res1[0].byteLength*2);
        }

        buffOut.set(res1[0]);
        buffOut.set(res1[1], res1[0].byteLength);

        return buffOut;
    }

    async function _fftExtInv(buff, inType, outType, logger, loggerTxt) {
        let b1, b2;
        b1 = buff.slice( 0 , buff.byteLength/2);
        b2 = buff.slice( buff.byteLength/2, buff.byteLength);

        const promises = [];

        promises.push( _fft(b1, true, inType, "jacobian", logger, loggerTxt));
        promises.push( _fft(b2, true, inType, "jacobian", logger, loggerTxt));

        [b1, b2] = await Promise.all(promises);

        const res1 = await _fftJoinExt(b1, b2, "fftJoinExtInv", Fr.one, Fr.shiftInv, "jacobian", outType, logger, loggerTxt);

        let buffOut;
        if (res1[0].byteLength > (1<<28)) {
            buffOut = new BigBuffer(res1[0].byteLength*2);
        } else {
            buffOut = new Uint8Array(res1[0].byteLength*2);
        }

        buffOut.set(res1[0]);
        buffOut.set(res1[1], res1[0].byteLength);

        return buffOut;
    }


    async function _fftJoinExt(buff1, buff2, fn, first, inc, inType, outType, logger, loggerTxt) {
        const MAX_CHUNK_SIZE = 1<<16;
        const MIN_CHUNK_SIZE = 1<<4;

        let fnName;
        let fnIn2Mid, fnMid2Out;
        let sOut, sIn, sMid;

        if (groupName == "G1") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
                fnIn2Mid = "g1m_batchToJacobian";
            } else {
                sIn = G.F.n8*3;
            }
            sMid = G.F.n8*3;
            fnName = "g1m_"+fn;
            if (outType == "affine") {
                fnMid2Out = "g1m_batchToAffine";
                sOut = G.F.n8*2;
            } else {
                sOut = G.F.n8*3;
            }
        } else if (groupName == "G2") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
                fnIn2Mid = "g2m_batchToJacobian";
            } else {
                sIn = G.F.n8*3;
            }
            fnName = "g2m_"+fn;
            sMid = G.F.n8*3;
            if (outType == "affine") {
                fnMid2Out = "g2m_batchToAffine";
                sOut = G.F.n8*2;
            } else {
                sOut = G.F.n8*3;
            }
        } else if (groupName == "Fr") {
            sIn = Fr.n8;
            sOut = Fr.n8;
            sMid = Fr.n8;
            fnName = "frm_" + fn;
        } else {
            throw new Error("Invalid group");
        }

        if (buff1.byteLength != buff2.byteLength) {
            throw new Error("Invalid buffer size");
        }
        const nPoints = Math.floor(buff1.byteLength / sIn);
        if (nPoints != 1 << log2(nPoints)) {
            throw new Error("Invalid number of points");
        }

        let chunkSize = Math.floor(nPoints /tm.concurrency);
        if (chunkSize < MIN_CHUNK_SIZE) chunkSize = MIN_CHUNK_SIZE;
        if (chunkSize > MAX_CHUNK_SIZE) chunkSize = MAX_CHUNK_SIZE;

        const opPromises = [];

        for (let i=0; i<nPoints; i += chunkSize) {
            if (logger) logger.debug(`${loggerTxt}: fftJoinExt Start: ${i}/${nPoints}`);
            const n= Math.min(nPoints - i, chunkSize);

            const firstChunk = Fr.mul(first, Fr.exp( inc, i));
            const task = [];

            const b1 = buff1.slice(i*sIn, (i+n)*sIn);
            const b2 = buff2.slice(i*sIn, (i+n)*sIn);

            task.push({cmd: "ALLOC", var: 0, len: sMid*n});
            task.push({cmd: "SET", var: 0, buff: b1});
            task.push({cmd: "ALLOC", var: 1, len: sMid*n});
            task.push({cmd: "SET", var: 1, buff: b2});
            task.push({cmd: "ALLOCSET", var: 2, buff: firstChunk});
            task.push({cmd: "ALLOCSET", var: 3, buff: inc});
            if (fnIn2Mid) {
                task.push({cmd: "CALL", fnName:fnIn2Mid, params: [{var:0}, {val: n}, {var: 0}]});
                task.push({cmd: "CALL", fnName:fnIn2Mid, params: [{var:1}, {val: n}, {var: 1}]});
            }
            task.push({cmd: "CALL", fnName: fnName, params: [
                {var: 0},
                {var: 1},
                {val: n},
                {var: 2},
                {var: 3},
                {val: Fr.s},
            ]});
            if (fnMid2Out) {
                task.push({cmd: "CALL", fnName:fnMid2Out, params: [{var:0}, {val: n}, {var: 0}]});
                task.push({cmd: "CALL", fnName:fnMid2Out, params: [{var:1}, {val: n}, {var: 1}]});
            }
            task.push({cmd: "GET", out: 0, var: 0, len: n*sOut});
            task.push({cmd: "GET", out: 1, var: 1, len: n*sOut});
            opPromises.push(
                tm.queueAction(task).then( (r) => {
                    if (logger) logger.debug(`${loggerTxt}: fftJoinExt End: ${i}/${nPoints}`);
                    return r;
                })
            );
        }

        const result = await Promise.all(opPromises);

        let fullBuffOut1;
        let fullBuffOut2;
        if (nPoints * sOut > 1<<28) {
            fullBuffOut1 = new BigBuffer(nPoints*sOut);
            fullBuffOut2 = new BigBuffer(nPoints*sOut);
        } else {
            fullBuffOut1 = new Uint8Array(nPoints*sOut);
            fullBuffOut2 = new Uint8Array(nPoints*sOut);
        }

        let p =0;
        for (let i=0; i<result.length; i++) {
            fullBuffOut1.set(result[i][0], p);
            fullBuffOut2.set(result[i][1], p);
            p+=result[i][0].byteLength;
        }

        return [fullBuffOut1, fullBuffOut2];
    }


    G.fft = async function(buff, inType, outType, logger, loggerTxt) {
        return await _fft(buff, false, inType, outType, logger, loggerTxt);
    };

    G.ifft = async function(buff, inType, outType, logger, loggerTxt) {
        return await _fft(buff, true, inType, outType, logger, loggerTxt);
    };

    G.lagrangeEvaluations = async function (buff, inType, outType, logger, loggerTxt) {
        inType = inType || "affine";
        outType = outType || "affine";

        let sIn;
        if (groupName == "G1") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
            } else {
                sIn = G.F.n8*3;
            }
        } else if (groupName == "G2") {
            if (inType == "affine") {
                sIn = G.F.n8*2;
            } else {
                sIn = G.F.n8*3;
            }
        } else if (groupName == "Fr") {
            sIn = Fr.n8;
        } else {
            throw new Error("Invalid group");
        }

        const nPoints = buff.byteLength /sIn;
        const bits = log2(nPoints);

        if ((2 ** bits)*sIn != buff.byteLength) {
            if (logger) logger.error("lagrangeEvaluations iinvalid input size");
            throw new Error("lagrangeEvaluations invalid Input size");
        }

        if (bits <= Fr.s) {
            return await G.ifft(buff, inType, outType, logger, loggerTxt);
        }

        if (bits > Fr.s+1) {
            if (logger) logger.error("lagrangeEvaluations input too big");
            throw new Error("lagrangeEvaluations input too big");
        }

        let t0 = buff.slice(0, buff.byteLength/2);
        let t1 = buff.slice(buff.byteLength/2, buff.byteLength);


        const shiftToSmallM = Fr.exp(Fr.shift, nPoints/2);
        const sConst = Fr.inv( Fr.sub(Fr.one, shiftToSmallM));

        [t0, t1] = await _fftJoinExt(t0, t1, "prepareLagrangeEvaluation", sConst, Fr.shiftInv, inType, "jacobian", logger, loggerTxt + " prep");

        const promises = [];

        promises.push( _fft(t0, true, "jacobian", outType, logger, loggerTxt + " t0"));
        promises.push( _fft(t1, true, "jacobian", outType, logger, loggerTxt + " t1"));

        [t0, t1] = await Promise.all(promises);

        let buffOut;
        if (t0.byteLength > (1<<28)) {
            buffOut = new BigBuffer(t0.byteLength*2);
        } else {
            buffOut = new Uint8Array(t0.byteLength*2);
        }

        buffOut.set(t0);
        buffOut.set(t1, t0.byteLength);

        return buffOut;
    };

    G.fftMix = async function fftMix(buff) {
        const sG = G.F.n8*3;
        let fnName, fnFFTJoin;
        if (groupName == "G1") {
            fnName = "g1m_fftMix";
            fnFFTJoin = "g1m_fftJoin";
        } else if (groupName == "G2") {
            fnName = "g2m_fftMix";
            fnFFTJoin = "g2m_fftJoin";
        } else if (groupName == "Fr") {
            fnName = "frm_fftMix";
            fnFFTJoin = "frm_fftJoin";
        } else {
            throw new Error("Invalid group");
        }

        const nPoints = Math.floor(buff.byteLength / sG);
        const power = log2(nPoints);

        let nChunks = 1 << log2(tm.concurrency);

        if (nPoints <= nChunks*2) nChunks = 1;

        const pointsPerChunk = nPoints / nChunks;

        const powerChunk = log2(pointsPerChunk);

        const opPromises = [];
        for (let i=0; i<nChunks; i++) {
            const task = [];
            const b = buff.slice((i* pointsPerChunk)*sG, ((i+1)* pointsPerChunk)*sG);
            task.push({cmd: "ALLOCSET", var: 0, buff: b});
            for (let j=1; j<=powerChunk; j++) {
                task.push({cmd: "CALL", fnName: fnName, params: [
                    {var: 0},
                    {val: pointsPerChunk},
                    {val: j}
                ]});
            }
            task.push({cmd: "GET", out: 0, var: 0, len: pointsPerChunk*sG});
            opPromises.push(
                tm.queueAction(task)
            );
        }

        const result = await Promise.all(opPromises);

        const chunks = [];
        for (let i=0; i<result.length; i++) chunks[i] = result[i][0];


        for (let i = powerChunk+1; i<=power; i++) {
            const nGroups = 1 << (power - i);
            const nChunksPerGroup = nChunks / nGroups;
            const opPromises = [];
            for (let j=0; j<nGroups; j++) {
                for (let k=0; k <nChunksPerGroup/2; k++) {
                    const first = Fr.exp( Fr.w[i], k*pointsPerChunk);
                    const inc = Fr.w[i];
                    const o1 = j*nChunksPerGroup + k;
                    const o2 = j*nChunksPerGroup + k + nChunksPerGroup/2;

                    const task = [];
                    task.push({cmd: "ALLOCSET", var: 0, buff: chunks[o1]});
                    task.push({cmd: "ALLOCSET", var: 1, buff: chunks[o2]});
                    task.push({cmd: "ALLOCSET", var: 2, buff: first});
                    task.push({cmd: "ALLOCSET", var: 3, buff: inc});
                    task.push({cmd: "CALL", fnName: fnFFTJoin,  params:[
                        {var: 0},
                        {var: 1},
                        {val: pointsPerChunk},
                        {var: 2},
                        {var: 3}
                    ]});
                    task.push({cmd: "GET", out: 0, var: 0, len: pointsPerChunk*sG});
                    task.push({cmd: "GET", out: 1, var: 1, len: pointsPerChunk*sG});
                    opPromises.push(tm.queueAction(task));
                }
            }

            const res = await Promise.all(opPromises);
            for (let j=0; j<nGroups; j++) {
                for (let k=0; k <nChunksPerGroup/2; k++) {
                    const o1 = j*nChunksPerGroup + k;
                    const o2 = j*nChunksPerGroup + k + nChunksPerGroup/2;
                    const resChunk = res.shift();
                    chunks[o1] = resChunk[0];
                    chunks[o2] = resChunk[1];
                }
            }
        }

        let fullBuffOut;
        if (buff instanceof BigBuffer) {
            fullBuffOut = new BigBuffer(nPoints*sG);
        } else {
            fullBuffOut = new Uint8Array(nPoints*sG);
        }
        let p =0;
        for (let i=0; i<nChunks; i++) {
            fullBuffOut.set(chunks[i], p);
            p+=chunks[i].byteLength;
        }

        return fullBuffOut;
    };

    G.fftJoin = async function fftJoin(buff1, buff2, first, inc) {
        const sG = G.F.n8*3;
        let fnName;
        if (groupName == "G1") {
            fnName = "g1m_fftJoin";
        } else if (groupName == "G2") {
            fnName = "g2m_fftJoin";
        } else if (groupName == "Fr") {
            fnName = "frm_fftJoin";
        } else {
            throw new Error("Invalid group");
        }

        if (buff1.byteLength != buff2.byteLength) {
            throw new Error("Invalid buffer size");
        }
        const nPoints = Math.floor(buff1.byteLength / sG);
        if (nPoints != 1 << log2(nPoints)) {
            throw new Error("Invalid number of points");
        }

        let nChunks = 1 << log2(tm.concurrency);
        if (nPoints <= nChunks*2) nChunks = 1;

        const pointsPerChunk = nPoints / nChunks;


        const opPromises = [];
        for (let i=0; i<nChunks; i++) {
            const task = [];

            const firstChunk = Fr.mul(first, Fr.exp(inc, i*pointsPerChunk));
            const b1 = buff1.slice((i* pointsPerChunk)*sG, ((i+1)* pointsPerChunk)*sG);
            const b2 = buff2.slice((i* pointsPerChunk)*sG, ((i+1)* pointsPerChunk)*sG);
            task.push({cmd: "ALLOCSET", var: 0, buff: b1});
            task.push({cmd: "ALLOCSET", var: 1, buff: b2});
            task.push({cmd: "ALLOCSET", var: 2, buff: firstChunk});
            task.push({cmd: "ALLOCSET", var: 3, buff: inc});
            task.push({cmd: "CALL", fnName: fnName, params: [
                {var: 0},
                {var: 1},
                {val: pointsPerChunk},
                {var: 2},
                {var: 3}
            ]});
            task.push({cmd: "GET", out: 0, var: 0, len: pointsPerChunk*sG});
            task.push({cmd: "GET", out: 1, var: 1, len: pointsPerChunk*sG});
            opPromises.push(
                tm.queueAction(task)
            );

        }


        const result = await Promise.all(opPromises);

        let fullBuffOut1;
        let fullBuffOut2;
        if (buff1 instanceof BigBuffer) {
            fullBuffOut1 = new BigBuffer(nPoints*sG);
            fullBuffOut2 = new BigBuffer(nPoints*sG);
        } else {
            fullBuffOut1 = new Uint8Array(nPoints*sG);
            fullBuffOut2 = new Uint8Array(nPoints*sG);
        }

        let p =0;
        for (let i=0; i<result.length; i++) {
            fullBuffOut1.set(result[i][0], p);
            fullBuffOut2.set(result[i][1], p);
            p+=result[i][0].byteLength;
        }

        return [fullBuffOut1, fullBuffOut2];
    };



    G.fftFinal =  async function fftFinal(buff, factor) {
        const sG = G.F.n8*3;
        const sGout = G.F.n8*2;
        let fnName, fnToAffine;
        if (groupName == "G1") {
            fnName = "g1m_fftFinal";
            fnToAffine = "g1m_batchToAffine";
        } else if (groupName == "G2") {
            fnName = "g2m_fftFinal";
            fnToAffine = "g2m_batchToAffine";
        } else {
            throw new Error("Invalid group");
        }

        const nPoints = Math.floor(buff.byteLength / sG);
        if (nPoints != 1 << log2(nPoints)) {
            throw new Error("Invalid number of points");
        }

        const pointsPerChunk = Math.floor(nPoints / tm.concurrency);

        const opPromises = [];
        for (let i=0; i<tm.concurrency; i++) {
            let n;
            if (i< tm.concurrency-1) {
                n = pointsPerChunk;
            } else {
                n = nPoints - i*pointsPerChunk;
            }
            if (n==0) continue;
            const task = [];
            const b = buff.slice((i* pointsPerChunk)*sG, (i*pointsPerChunk+n)*sG);
            task.push({cmd: "ALLOCSET", var: 0, buff: b});
            task.push({cmd: "ALLOCSET", var: 1, buff: factor});
            task.push({cmd: "CALL", fnName: fnName, params: [
                {var: 0},
                {val: n},
                {var: 1},
            ]});
            task.push({cmd: "CALL", fnName: fnToAffine, params: [
                {var: 0},
                {val: n},
                {var: 0},
            ]});
            task.push({cmd: "GET", out: 0, var: 0, len: n*sGout});
            opPromises.push(
                tm.queueAction(task)
            );

        }

        const result = await Promise.all(opPromises);

        let fullBuffOut;
        if (buff instanceof BigBuffer) {
            fullBuffOut = new BigBuffer(nPoints*sGout);
        } else {
            fullBuffOut = new Uint8Array(nPoints*sGout);
        }

        let p =0;
        for (let i=result.length-1; i>=0; i--) {
            fullBuffOut.set(result[i][0], p);
            p+=result[i][0].byteLength;
        }

        return fullBuffOut;
    };
}
