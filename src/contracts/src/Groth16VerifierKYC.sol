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
        return
            G2Point(
                [11559732032986387107991004021392285783925812861821192530917403151452391805634, 10857046999023057135944570762232829481370756359578518086990519993285655852781],
                [4082367875863433681332203403145435568316851327593401208105741076214120093531, 8495653923123431417604973247489272438418190587263600148770280649306958101930]
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
            case 0 {
                invalid()
            }
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
            case 0 {
                invalid()
            }
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
        uint256[] memory input = new uint256[](inputSize);
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
            case 0 {
                invalid()
            }
        }
        require(success, "pairing-opcode-failed");
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
    function pairingProd3(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2, G1Point memory c1, G2Point memory c2) internal view returns (bool) {
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

contract Verifier {
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
            [4252822878758300859123897981450591353533073413197771768651442665752259397132, 6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679, 10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634, 10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531, 8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [10343081133609258106524901662136446830203953069418302653607138025109354852056, 9807164380251633320270781057851447975413763120899682835651746536114812553994],
            [9944420113684168402007836039557494668185622235286586265128723919315954929511, 19577108980448557774164310518706121321497510178047308624728190351127007029613]
        );
        vk.IC = new Pairing.G1Point[](41);
        vk.IC[0] = Pairing.G1Point(
            13911334274401924343675544560041308512588936901424910915603782906803297287632,
            2706123920292725976458900370590743282893519207291145650034358362573351809778
        );
        vk.IC[1] = Pairing.G1Point(
            6985983538948125859102879759305585957033692335816034727504459126154150675393,
            19972750462935050417295831096846277473290254620709512808517185507733918100846
        );
        vk.IC[2] = Pairing.G1Point(
            7744013186186492394192214327299469757175689346110767167154898216471196095085,
            6702729055720766626065307937755216430432678137682221614353038778589657960048
        );
        vk.IC[3] = Pairing.G1Point(
            255915235030371991993484001712616086436758891388484439648352245043294529900,
            4179505299213548642445718315004146505466351834266056645355508781336008368451
        );
        vk.IC[4] = Pairing.G1Point(
            14665449237617429987947939493398796988508835581367002665682766941024976091705,
            762004656482205873626930109934934985880770906990530286373664203254704399119
        );
        vk.IC[5] = Pairing.G1Point(
            9891081518337938052858589684877032246112975663226300403315954293261278376940,
            19489996687572280863382620397533026772053282893687720955820232087604849495176
        );
        vk.IC[6] = Pairing.G1Point(
            5800952410174350989374575600427733477116335318735807160590138906298167392978,
            10087684366978175789571270859672147139504313886600685836467201147453228792716
        );
        vk.IC[7] = Pairing.G1Point(
            21351332895842959440410596862055681606274721309941311913188097986540391756486,
            2307072863391971707807462264997264310991255504705487943650727153057932486703
        );
        vk.IC[8] = Pairing.G1Point(
            13010659854056812016439519531663311954437532545284071926934993582761474224894,
            15816218888092633942089854415791255109502438402393571397446345369212440492159
        );
        vk.IC[9] = Pairing.G1Point(
            5053705414025665707100333667090818209330898042069933520812706581768614416747,
            15102167500006968672268298512544770652224200188765016527963864802106967926258
        );
        vk.IC[10] = Pairing.G1Point(
            18842434238151770363997463153238823211722305234308000152572121185461721165534,
            2593387840584284469427225866602223950231412681510330394144072762948160157256
        );
        vk.IC[11] = Pairing.G1Point(
            15599182068312680660960536864833796975142938275261895467487695736451312294383,
            4666518800946599840711720480266222815125027594955011646010035289619688501056
        );
        vk.IC[12] = Pairing.G1Point(
            9113330458144966221935075056421416883691137461488614310024809145998323557603,
            14525998074188030501201355527081933288769508591085401978245999429699317995155
        );
        vk.IC[13] = Pairing.G1Point(
            1698361326922985986278517202575612983085060321585257306576729960115662047082,
            10811440926949560531025358441147529667704238851901100869553842063328440863767
        );
        vk.IC[14] = Pairing.G1Point(
            21813322714619416501160428454453290155766777717262000799102654107816607855965,
            1900098864322431724982182925647723282402120214677411997484653888105945993420
        );
        vk.IC[15] = Pairing.G1Point(
            4850391572444221222891473530479010507625931117274574478058276734887281510448,
            21209333872097499618431030650092175877302366840044306035116464128115890800796
        );
        vk.IC[16] = Pairing.G1Point(
            11024325828225418385172578260153741127557638280432460894781093623688133027317,
            12829771981770099593305823120912530429245566056736702770500768601904968866660
        );
        vk.IC[17] = Pairing.G1Point(
            6499199902234026878468170995556481877772698039370309856572671196533366057357,
            4457036475648163147639419384098488748765647820786558552307664597920606634328
        );
        vk.IC[18] = Pairing.G1Point(
            18022767910853449640857081466776039368894005536449264312356527521962753150045,
            19255367004765661489282403633399213738840373861881573851712640969865112253205
        );
        vk.IC[19] = Pairing.G1Point(
            3407915644635962426547873514159178484708180897582674981651195673063889056527,
            20900842108041417167531653748937888806375160842841645236594766769740801086240
        );
        vk.IC[20] = Pairing.G1Point(
            20017654297737842052107095428206289877193449936297035323430379821054305801225,
            18398515026520352890282481306377861550205376583366632991373903923950653555070
        );
        vk.IC[21] = Pairing.G1Point(
            21047973865590898317558361621568151146087679718605108018529528496898961038772,
            21278634433260452963308259175825820317340782823939379578046404446402428234210
        );
        vk.IC[22] = Pairing.G1Point(
            8241145138357410146565515812882570766759410582275691347723108605200802022956,
            1989081011088741796912864754739172167152133683074048511937493943117875172858
        );
        vk.IC[23] = Pairing.G1Point(
            17569097387405075516786396328891553530486899788694929338454645324083714108418,
            2671272267873010509558066732587132159825241218632027523162826309557010040801
        );
        vk.IC[24] = Pairing.G1Point(
            18432934328198141990735900067700545183644918237318871758528883499458953191751,
            12907904986298391408698324332133566949685445388692800711291464791587658944848
        );
        vk.IC[25] = Pairing.G1Point(
            11647174916828858228600836692025264965425510498861972640414508608610165498786,
            2789266155005779176091573091508902987969786671406288086616050740944435032366
        );
        vk.IC[26] = Pairing.G1Point(
            7716599352357689662437791281378834953674147767709763441696690660416798000193,
            2011956446519231175256986068510459528070989280957991078572908702061967826029
        );
        vk.IC[27] = Pairing.G1Point(
            14881679753221971431657980926845949992839985126401023404107224715610776731068,
            9378592721036535509644483460953612255671078585476916759911615244007744068220
        );
        vk.IC[28] = Pairing.G1Point(
            5152714233547642924425453943362933487670747811842493222288515712293139545616,
            17103096071991383067025581815771854616548148128756030455605263703527561205910
        );
        vk.IC[29] = Pairing.G1Point(
            15447374417074702151058563859314109816008078225151836487467438630855834394189,
            17622407048249609790965427996195733485238662836944547380822418048735288467805
        );
        vk.IC[30] = Pairing.G1Point(
            8651195532923628086866919418072252415467334585437736376449571499823619232889,
            14998264407811038481851626580083663176688649010417880010392153937322836336730
        );
        vk.IC[31] = Pairing.G1Point(
            7458457418733257481313115870700418691758253843381439582888002847293920934780,
            542167882620985531753545552575713620470656945139339404822606611648495438637
        );
        vk.IC[32] = Pairing.G1Point(
            11654478610393315165602893189754745536674121231400580736622038568733670735982,
            12257355783551921174011032474512008533083087974719806073358692398516604463769
        );
        vk.IC[33] = Pairing.G1Point(
            20322635549433112154444217943766297421929292916507426703075749847590584882286,
            17064859567711980715716858605905961120685111304069430254040524583096277093911
        );
        vk.IC[34] = Pairing.G1Point(
            2351611421496751815297337091125626628153834298569012697092929966223240549367,
            8981623119830487140187538030830803038148631170446603756509370347108713360372
        );
        vk.IC[35] = Pairing.G1Point(
            14536962684274075654744716239480828438557306956570655739004040615159003943312,
            15989427664222476135240023865637576890575158594894752990204712714267063734873
        );
        vk.IC[36] = Pairing.G1Point(
            2619628326543741336308640920600617374518257676707551075589324630412339157610,
            7966211775560790007913238855770952022525432549688555817284872825049075239614
        );
        vk.IC[37] = Pairing.G1Point(
            687223592036625422088204689474192126235881791115711355027369272731146690572,
            5456875514001475540695452284699708537730275839107823178023311848531691970413
        );
        vk.IC[38] = Pairing.G1Point(
            6946456658180332721992546139783275797641755855230168345362036906695016641551,
            11316286553478747631365490256288642487416717626257031294300167632075226007209
        );
        vk.IC[39] = Pairing.G1Point(
            18376919354566106859685708361984142415330243406938923421496478653958087728870,
            8827642705442411540364786437220347440481285673685576911202226958271761055385
        );
        vk.IC[40] = Pairing.G1Point(
            6057728902703241688367200208848751084102678742749995632673910557958470618058,
            7921304270410952949195938865544544978067811906564190603914442420062807566570
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
        if (!Pairing.pairingProd4(Pairing.negate(proof.A), proof.B, vk.alfa1, vk.beta2, vk_x, vk.gamma2, proof.C, vk.delta2)) return 1;
        return 0;
    }

    /// @return r  bool true if proof is valid
    function verifyProof(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[40] memory input) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint256[] memory inputValues = new uint256[](input.length);
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
