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
        uint256 X;
        uint256 Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]

    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }

    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [
                11559732032986387107991004021392285783925812861821192530917403151452391805634,
                10857046999023057135944570762232829481370756359578518086990519993285655852781
            ],
            [
                4082367875863433681332203403145435568316851327593401208105741076214120093531,
                8495653923123431417604973247489272438418190587263600148770280649306958101930
            ]
        );

        /*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );*/
    }

    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint256 q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }

    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }
        require(success, "pairing-add-failed");
    }

    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }
        require(success, "pairing-mul-failed");
    }

    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length, "pairing-lengths-failed");
        uint256 elements = p1.length;
        uint256 inputSize = elements * 6;
        uint256[] memory input = new uint[](inputSize);
        for (uint256 i = 0; i < elements; i++) {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint256[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success
            case 0 { invalid() }
        }
        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }

    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2)
        internal
        view
        returns (bool)
    {
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
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2
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
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
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

contract VerifierNonAnonWallet {
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
            [
                4252822878758300859123897981450591353533073413197771768651442665752259397132,
                6375614351688725206403948262868962793625744043794305715222011528459656738731
            ],
            [
                21847035105528745403288232691147584728191162732299865338377159692350059136679,
                10505242626370262277552901082094356697409835680220590971873171140371331206856
            ]
        );
        vk.gamma2 = Pairing.G2Point(
            [
                11559732032986387107991004021392285783925812861821192530917403151452391805634,
                10857046999023057135944570762232829481370756359578518086990519993285655852781
            ],
            [
                4082367875863433681332203403145435568316851327593401208105741076214120093531,
                8495653923123431417604973247489272438418190587263600148770280649306958101930
            ]
        );
        vk.delta2 = Pairing.G2Point(
            [
                1513129022268504209358763521777110646559191312944535983790343685540452445612,
                12195000584114682213316512369139242650405673197296308277565313794080256232701
            ],
            [
                8360772797757285669693588223224368324652217960280535125476432579464480898413,
                520894096459672819696448581165649200639580943346471218758886059131097679200
            ]
        );
        vk.IC = new Pairing.G1Point[](35);

        vk.IC[0] = Pairing.G1Point(
            11537328283226768393732428330956073110918624081922605220849994462257164716154,
            21836950190585457727786541794875874204342457073442279657287670575335295859939
        );

        vk.IC[1] = Pairing.G1Point(
            2646307150509379456483324388204599416197823343744573056776580441757968778128,
            14368370831419521837815784599306984151624772530159432470308283448431330483438
        );

        vk.IC[2] = Pairing.G1Point(
            16971624750468472956383457363672950966338870541072731251437414691217134411120,
            8171770470043873321771537156021753591829282779422875691859226771666334115210
        );

        vk.IC[3] = Pairing.G1Point(
            17003248154885997024042723500051841853373913724967509464380365353802575974728,
            7268687626523176370339202918269959082095447462862347953587350206552205642559
        );

        vk.IC[4] = Pairing.G1Point(
            9147424234223179035895482077044817222415554273556867838268712944193520459125,
            21578705994822322813698189503736815299185497639660343771670537250469027755948
        );

        vk.IC[5] = Pairing.G1Point(
            16948417333412259029407181850226843375508933350680650127572170476630717282234,
            9665563179883720332817127456522837835577284997912132910805194791161889398512
        );

        vk.IC[6] = Pairing.G1Point(
            9319994583370423638602672994382300950312503535351144768052894387193551537459,
            19171031111811822064434269353657536224339902296340766041252096715670766153578
        );

        vk.IC[7] = Pairing.G1Point(
            9371603635986601434942264619807195148477116766259006354709633771674992552724,
            11103293940652841271958831421967970005702672122254116205870466468493278826958
        );

        vk.IC[8] = Pairing.G1Point(
            3561757143230234005632456376532802121489770329687277876867422136368222736134,
            11734814901687269585580202167146602218102049962630061844516173384912435005151
        );

        vk.IC[9] = Pairing.G1Point(
            16676238706569507337573176601181670688707264606170712075388734731572549373015,
            11158592034910239776632780480510406146251140896522712858892689171974748083747
        );

        vk.IC[10] = Pairing.G1Point(
            9822993420542467873912218347366938030193407618831916003032667186678059114349,
            6863223533781083402167797754430699108902384970089129346113470095574463296737
        );

        vk.IC[11] = Pairing.G1Point(
            4866721301322510775531094866459672146070982818674092273969310571220291630556,
            9846640210996171367705574856419053631553093780701851221089070591862473684456
        );

        vk.IC[12] = Pairing.G1Point(
            11121919417977708038028243712145798541888876824913262431306415256568966652024,
            12609770408698645498350514024296607224475353273713173177251900216074217014850
        );

        vk.IC[13] = Pairing.G1Point(
            14840050373651993593383756529988239317958775236310376879012996717055845150487,
            16683016138329247649135414505803188190565946292769946693147365719646757192352
        );

        vk.IC[14] = Pairing.G1Point(
            12331471170495648864015185687161748641193043583582691780623236535573811426959,
            11714531956225516771424892308789701085922077646343882797070434158311220922011
        );

        vk.IC[15] = Pairing.G1Point(
            20857366342421630154576707922479406842052250461154457549932210545889187427626,
            19731871495034015170236307573440414758884960293847791130561428843792753429086
        );

        vk.IC[16] = Pairing.G1Point(
            16209406523379999199236029863462575441846948663847567298395841886469797214082,
            20718988335004414356172240953954108902387108184538803896124546491420460740169
        );

        vk.IC[17] = Pairing.G1Point(
            8397179853577453858892608876746062307226175687475102639712031393841003387919,
            7154528864876839718549215559715861424372452521581853695056564308745992761672
        );

        vk.IC[18] = Pairing.G1Point(
            15000425614899689626185464253582174491572354417903507356426258449407132127046,
            13602373364472815067534003393627538602411204908660744540946955553406039633451
        );

        vk.IC[19] = Pairing.G1Point(
            5545252939208963791309142258539499940294193526436021787091019273144246885261,
            2675833647327088808677716501235324721140769279456271927816550777395489852251
        );

        vk.IC[20] = Pairing.G1Point(
            2537047834074478023060297384888724410218136939149736151242515713484635642789,
            3193147508270124393755481767836877808561856886429215905854576456538260642120
        );

        vk.IC[21] = Pairing.G1Point(
            13819984179784763421503658502014430958296359352165019537755065452645355466085,
            18994178127386658997162783196808799873728043389545801736093808610346271161658
        );

        vk.IC[22] = Pairing.G1Point(
            6589370869708283514329318539826110923064805897289825414235274269171407140900,
            9625792054986455984618262255946246252268480571067521104852530192902386719593
        );

        vk.IC[23] = Pairing.G1Point(
            14453270681522455527144160729543145025587040770258214008741757192612444737673,
            20143300120523312381709649823189168032874279267240134119356286009260298185475
        );

        vk.IC[24] = Pairing.G1Point(
            8846979524751473322994268234754538401482894217522349506066299416316984717260,
            14238278950875447301003974303300008365515832894025960431754069250458716988985
        );

        vk.IC[25] = Pairing.G1Point(
            1407828395464361821905309927863167268883721160860555328581866885124611897528,
            15987854649208373291691713233856831065610123809032682196292981616658494776987
        );

        vk.IC[26] = Pairing.G1Point(
            20657483817998070093869648777824400547660398552294774144027193285451239619382,
            21826613460615350291777797645121185151869814459512699120411019581958075991542
        );

        vk.IC[27] = Pairing.G1Point(
            20624928617240774729161710928323453036077574938263627000040473137006018415415,
            5131454817008842892320970265930200727731593782574755474310860262365965990664
        );

        vk.IC[28] = Pairing.G1Point(
            13895249990164764352618348094492621630575085672410127797817030490897283284460,
            11796920177436300262655702063092510613755939821586920802170520825907606184557
        );

        vk.IC[29] = Pairing.G1Point(
            3135811994020780743324086008729747183900335277491189104250977002197575809365,
            19637480211624980857501152516366188197895066151113910763057713919944678029866
        );

        vk.IC[30] = Pairing.G1Point(
            606103022421566187118689786319065266252504972683102249226453076393842587324,
            10274587862652629723961486759561149321143114208996217550785138347396636546119
        );

        vk.IC[31] = Pairing.G1Point(
            17876636758905622230688544604495142065478803287376541138330575508029036910921,
            845514606482911379811389987862147832754587150586772012493153117259870748818
        );

        vk.IC[32] = Pairing.G1Point(
            3055934057788309375612017678081361462642124203699024466299800387864964176162,
            6215463225683464296816602777995066291454589608119271052091343612576965188139
        );

        vk.IC[33] = Pairing.G1Point(
            15655816926053512024400351678850471800118254812943223488624167720306406940886,
            1318451441938966067851976459607266837893918068783070216555767331693196884126
        );

        vk.IC[34] = Pairing.G1Point(
            13942491345765259320815758221010163510633256522676138655574537850419728932090,
            2449428677603436766608016448595332101485961035234011384134049218692804513154
        );
    }

    function verify(uint256[] memory input, Proof memory proof) public view returns (uint256) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length, "verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field, "verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (
            !Pairing.pairingProd4(
                Pairing.negate(proof.A), proof.B, vk.alfa1, vk.beta2, vk_x, vk.gamma2, proof.C, vk.delta2
            )
        ) return 1;
        return 0;
    }

    /// @return r  bool true if proof is valid
    function verifyProof(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[34] memory input)
        public
        view
        returns (bool r)
    {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint256[] memory inputValues = new uint[](input.length);
        for (uint256 i = 0; i < input.length; i++) {
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
