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
            [20842617735139635934164414975805786316832085422150829638851154409960775364686,
             11384141860017094049690792653641697071856972098575231886066776223298851082592],
            [17754468779498165002730651511871062279063834345767377727484143830122723707686,
             16990918919705950483809642968282598115601828470771660644824970640708826907506]
        );
        vk.IC = new Pairing.G1Point[](28);
        
        vk.IC[0] = Pairing.G1Point( 
            19979818312650249281018016981052950968675990952627346907483591409385889371334,
            14675330954786426353321242780661450755204240791125907513954615409547191814285
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            5829003113921117432206175983572010026961474373472855647935001341465808816339,
            19782944755006085617526906642429180306138946798837355469130386866160911601011
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            12588535573679309327992671270902604443900873491408310753588166121975917769023,
            8219477726636990585687042181227262680748408234115867638626693699807529624430
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            16419566697611418137868233429812774560970274989774297684287789963725247230594,
            16739285080804767717417083389880687834670337497889709161148870804899232453933
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            16265380280881177170721470304996523746928776552716196405150646742099377669931,
            19638885469076190510322825514105945378813865877644439953162824321505237392070
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            6796494020533467002863143139458992782913216971691648483712266994414215291949,
            9707665463330159969812119514363493770851005080885912428651081561719521094933
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            21544862858428587736887827977241946178420087708877339811347489861404200945678,
            2500513994651656141840810268606328266633030698182038222554168868998950911851
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            1230711131658930327648030092718986304477079060235946436492012186862476441198,
            2924327811705850943352392316547023661300393599290009775476572413301695659477
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            4593824226566234819232211820162561709239122795404699806154965441179806789185,
            9489624936684684917819113770049200619128274295587594808702038943690694641556
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            2920165003775211935037985895884368960628002338669905002705242721889293661500,
            19325075961718529602218214575556958381871801093875004623824789089894826295257
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            798816348892537467071912883235430376248661781038228218104756604377494380304,
            11781557459672808558858136202683204507290115613628432130488538278285238135010
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            12364547354186510362274174544601523892849537922961743171051730704612856215491,
            1940501514916509359250239441208143117730918007390438148791819014454436111300
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            19374594578181611716973001664490855487600832530676195301956619061624976816219,
            14177536357346623944961788153399669848956517572484804092424908023324631652114
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            13278036469043701173415661010457809115535144694893393869550044351530605334767,
            17412800250990974973260595224521507568391191455832434113883056179425663097823
        );                                      
        
        vk.IC[14] = Pairing.G1Point( 
            9915947382759385783486901323053324677105393406725118625368034668340091270389,
            16486030947539867411575826079702988059459377097615987701025504390895170318699
        );                                      
        
        vk.IC[15] = Pairing.G1Point( 
            10032727001807914582863553934823535175601796608073836535872731307698533085785,
            3081085031123792073612063961064472989961107449944557192691595148458951458227
        );                                      
        
        vk.IC[16] = Pairing.G1Point( 
            12861664141229362488575301280006958327960741616945360590354230646571221543276,
            9465078685742145838883804510121221671872710132970132842647710792990557843321
        );                                      
        
        vk.IC[17] = Pairing.G1Point( 
            5005765047541457738526606112299880823121166660296178632472432158059866023590,
            800508591566316812025121111977116353798488540486465046929671355188348296221
        );                                      
        
        vk.IC[18] = Pairing.G1Point( 
            8233737885441865638780817092959136454488041028245340573670741092114576019836,
            1905649541669160515152119016722479564120799606865265758708514046334911361937
        );                                      
        
        vk.IC[19] = Pairing.G1Point( 
            18783017403141463325045721611662222497187068636914351056270968332721736892315,
            8662142271865866054873642500672292664959895899040501045955952275645237184560
        );                                      
        
        vk.IC[20] = Pairing.G1Point( 
            10527153227169483592824206336300422008699543534031594270383348457913225882068,
            12804751884521386825828658510190690148865851791523892609868081031939605961358
        );                                      
        
        vk.IC[21] = Pairing.G1Point( 
            5041944607478059177624125335241251234509534257695185749390941036022860960816,
            14715110692011943220034133025600270907853469183775324358827935283475641931483
        );                                      
        
        vk.IC[22] = Pairing.G1Point( 
            6488469541772400815270748483575613205398117193227035746999009466332002218363,
            18106240437835593271599347077483242513463538315052985603960081531158477315442
        );                                      
        
        vk.IC[23] = Pairing.G1Point( 
            1230872150417054152826647550639910854731193569978803913801080823930604821153,
            4441239834640115257417519970272248211734460485545616030668417315357415914154
        );                                      
        
        vk.IC[24] = Pairing.G1Point( 
            6406343488542573114884112413464096480828930995605113106495691687545227712109,
            17426609856363619856299264045979224732259410005301876158111198396440753914863
        );                                      
        
        vk.IC[25] = Pairing.G1Point( 
            3552034247779690337035218009628728589744256014872407428271837630950111570086,
            6728361796164047891923136810794508198912347890773721917248600316699829273168
        );                                      
        
        vk.IC[26] = Pairing.G1Point( 
            948342784008576109120692844149854821628015902379340058471998856660569607438,
            4633908852276178055277686663038238149681803147457082772385350331688615889853
        );                                      
        
        vk.IC[27] = Pairing.G1Point( 
            21129924232298165271716993152147563181842275129196804812070970314890747717785,
            9683526736375356336643305294106801093801613041259654463352645091404426211815
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