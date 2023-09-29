//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.11;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Groth16Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [18808060808525638036282886872927163102128361949790911848040814488877726097988,
             10691070747855859196581614930310750535552032715428945750934843031952018248314],
            [8708563217553641320059365884325546819621226136060538508351127675575713242561,
             377918791816612197778660947645595073926081256462251134772414777379619998058]
        );
        vk.IC = new Pairing.G1Point[](28);
        
        vk.IC[0] = Pairing.G1Point( 
            17214959810005242086829037063831589403730795912402636969639365844955471428299,
            3054116542127582396793730506894277450749657274558112132477275635718599653776
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            11915615913781667842780627666123822279214180375690805541416232343116835486168,
            12196126041744283546109104325209493495749293230556748540831621749044969474684
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            9043483190620861958259942775630370496546651645430905733642931353364985964146,
            10143726827482116969187650909872956297652486699472528342770325209377780952591
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            1859185184595128928400156681850860379841969815551199257529148339070113499673,
            10146137679862866953902997870289421432884253271780315533088963651073658457912
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            11312094581286345282646294441475579847686327012399079465670626827166260520920,
            16474051251990536421949924126204865775849000724620715129700286084616920221829
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            9256775384525522282182900792105009616057552062814014197364513995235774284990,
            15742781661178013121192339139699300295951435183304173120449443562812471748295
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            13408391450181433752012353876972344119584005967630926781984465621463127201162,
            11339880742372454669008647586628478669642304105630965137880235275658750439969
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            1155209263940370636233049758208568844037457446134405425773336679949376731747,
            8297658923667966078881262554038150038583182277830928321884988050637589691731
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            8568014052156311595312407516888455089585459011317085940398196970285142458769,
            9700037607439329367323534206971771464882310618769742564276643680403276692504
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            11630697218800064879639474464527644711421904307248894815826958980587292327160,
            11526154111602235829687800070148637296845338075275726866927299405292678833472
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            19219832442671550636050544069200164622944078485223094749517295539324999526215,
            14002341394023082901655518412341329113007814587286499208543728009907772051849
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            13348067791255034343110270586483624861038169257298907793413859517423398552211,
            18738405520703198490757556652569837029753489219895458252257383351346732978790
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            18234226581407232522231079219148478784849193192069024794548730160353286293914,
            18684067970196453434687800834498544534564833348131103272199629026692037455010
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            11284190014403138448560805572453615799412167918605058082274252287031938853553,
            13070645834016375898599672376749744514149983985741422146195982284615859921302
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            5846111629737677704245178859045039997001113149795737177429409212097169909389,
            19683324412907325418108427460117203666623711821326068060127289624715366391766
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            15744551973413700458755610123095909464125753022218933173522211461039796658521,
            3189648311645686016032917542327159004165657996225239724277278574981343630814
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            2418297021987964246606335475143261374020182080002442984140201389122768390348,
            1896580202657524899278853751184357438262377245623642727531354836287022689335
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            11136122286830320547252687652619696854382086238326471175361258640265668618959,
            15482234450520324737886814597690239583927036581857352943248112533060966273479
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            8690349486306514661745024363447128200373651064423138011228239724645814630032,
            2508004783292476634375978374439875397619258879632456964936502183139797571174
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            1746534536074708945469070214389506085497103273825979813110460037301593912614,
            10461771827609307627611406263034493473473332990195276540532341496035819944707
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            13186635694632190283693252153643783444126249088615405467572998199885162445062,
            17095883599680013711322939255211460295868329689533828683331114229227468046092
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            8143256566870853084513728605613254365852342587087387911135467634274199059303,
            1937878435800672940648085421467805161925270717485722677739380962609591610337
        );                                      
        
        vk.IC[22] = Pairing.G1Point( 
            10169044203440479563133985042772559949079052922017212344523816504877450066166,
            12587810663211097740663804055747950432895462137751618182117463218159480687668
        );                                      
        
        vk.IC[23] = Pairing.G1Point( 
            2124127389808171175483550704843167460284738732559720666316996925126473910779,
            8636583184460326210130317935371167139506766876092536921655015095586076486035
        );                                      
        
        vk.IC[24] = Pairing.G1Point( 
            6149611949654747114901297761690556417170608496837638791122356628493501641693,
            11111335394790140054686219531116784390860831532970097917684760210840862949249
        );                                      
        
        vk.IC[25] = Pairing.G1Point( 
            21453858521520826349313583207438583509913402663631684634684856011953830861191,
            7695380882735336066444627988068158438569855666112078791893026861104264360519
        );                                      
        
        vk.IC[26] = Pairing.G1Point( 
            6911719381875546554310641673012593541960003626583120557325564842550043000316,
            1339122353519256074813359909487109233466482514833872653081103295834496203879
        );                                      
        
        vk.IC[27] = Pairing.G1Point( 
            2787357462231839501473491458489126728072220643047348969883996710342755129833,
            6633122798645647443092128217573465201346196732797433574994437376305223005431
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[27] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
