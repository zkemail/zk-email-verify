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
pragma solidity ^0.6.11;

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
        );
*/
  }

  /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
  function negate(G1Point memory p) internal pure returns (G1Point memory r) {
    // The prime q in the base field F_q for G1
    uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
    if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
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
      switch success
      case 0 {
        invalid()
      }
    }
    require(success, "pairing-add-failed");
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
    uint elements = p1.length;
    uint inputSize = elements * 6;
    uint[] memory input = new uint[](inputSize);
    for (uint i = 0; i < elements; i++) {
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
      [11559732032986387107991004021392285783925812861821192530917403151452391805634, 10857046999023057135944570762232829481370756359578518086990519993285655852781],
      [4082367875863433681332203403145435568316851327593401208105741076214120093531, 8495653923123431417604973247489272438418190587263600148770280649306958101930]
    );
    vk.IC = new Pairing.G1Point[](22);

    vk.IC[0] = Pairing.G1Point(
      12994226918873589184973686928509303296560829040421679966554788871610722975666,
      19546003293245789033051514407489605917742869051853168678675952551588673264059
    );

    vk.IC[1] = Pairing.G1Point(
      12803481875393106746548008498445134277525885425145232429904868659552497497795,
      14694537564331845125620823836332201159223992527131190273671921404972056438350
    );

    vk.IC[2] = Pairing.G1Point(
      12896526600976836570191398155392714054965141616837004359997046349335306162721,
      19989434935534803930041038636337516057507187085720073704180685028185491943059
    );

    vk.IC[3] = Pairing.G1Point(
      1316318882292921074427417498918167024758763552548146498412670277806150908690,
      4496675464734154714119497950957313125247358066733690814270807794291803734246
    );

    vk.IC[4] = Pairing.G1Point(
      6095412520421880843686410733562452820125095067123376214642702693632219147919,
      18805124981571223044033930919909367820198635605339887372165893879595885917681
    );

    vk.IC[5] = Pairing.G1Point(
      2491592648113503772389081945290063076975598019801589629533440501442845841156,
      13391234389463383825331371383043116227852107840306198632599020502591729622484
    );

    vk.IC[6] = Pairing.G1Point(
      6195983279938368142523765739331129953873741365958978404100950251126336420619,
      15255523481575331608052032202923784309897551868856977174561927351542766503103
    );

    vk.IC[7] = Pairing.G1Point(
      11364908849898553727983936508468303936453241846181145049706378426559053436737,
      12272143028059829557388953943471298784072389097212881142482116493849228345944
    );

    vk.IC[8] = Pairing.G1Point(
      7999645601849353569331229788079982131126962928370124718709121582700741706743,
      2344057992213881398120960053462701488822252700578864159913460281949725551948
    );

    vk.IC[9] = Pairing.G1Point(
      16032444542449207733074464012443666729463280555253921300321226108727384337838,
      15550284302068130534143630938965558367339743479932980144836777854141162045599
    );

    vk.IC[10] = Pairing.G1Point(
      14746811931688438261460396174433278363575571145186986664727520211845005639214,
      12430585284621277256717932006846197725061776365493376477691372628343500830841
    );

    vk.IC[11] = Pairing.G1Point(
      9665472323900251212386389887072355571286254407686859980386007760322469415859,
      14996755965687753932946931756264151392152419779360225521200890974252292420412
    );

    vk.IC[12] = Pairing.G1Point(
      108004501448464767377877268616442057348817885652988877682944326307051832181,
      14352072319589824562053349181969574390668378410837840879062264124706247340441
    );

    vk.IC[13] = Pairing.G1Point(
      8241644122136047663973273182299008352335433437918941847881738731207527978408,
      13326634974373964259912482627512460794400032234388182531625125624431239351434
    );

    vk.IC[14] = Pairing.G1Point(
      19079198509719557568724303856873450227277338931054655042976782137976461081455,
      20099741154760778542873760951130722650539994221026926650223788312866275905057
    );

    vk.IC[15] = Pairing.G1Point(
      12776213961119493875955017544545281842733223900358858158966892223397818263003,
      13049175944477161115063479837952228706325305696565228051297866932929773226361
    );

    vk.IC[16] = Pairing.G1Point(
      3677175527878880765823827286256329959476800348470829607774669755005589328592,
      5960302772589853676080934160184945132281885414289323557538680756680173217763
    );

    vk.IC[17] = Pairing.G1Point(
      3845518388361833739355416292477732378976881884807825706781410508823338000844,
      14643485171032551307429410040201611507475314617619869031588843852404758800222
    );

    vk.IC[18] = Pairing.G1Point(
      12781800159969915448548725085816037348380685059680464559080293032138144200069,
      8293835978235721621083584748448494414574099111793175131815478014921624321923
    );

    vk.IC[19] = Pairing.G1Point(
      2679784852932993701185917737851208220646508350009220493871893673616712782876,
      2455480317203964036392487392172013165313334147345673527798783221956163967174
    );

    vk.IC[20] = Pairing.G1Point(
      4240406231108001399618612059193031408047888754255460798137984403589376061488,
      9804154717486719329041740755091695338827486645577286903421673068934216499944
    );

    vk.IC[21] = Pairing.G1Point(
      12028012375636649231431542422094056328652150783328682821491835725444465403330,
      330627474571770559729829431278328850519463731324979004581250682428211832702
    );
  }

  function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
    uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    VerifyingKey memory vk = verifyingKey();
    require(input.length + 1 == vk.IC.length, "verifier-bad-input");
    // Compute the linear combination vk_x
    Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
    for (uint i = 0; i < input.length; i++) {
      require(input[i] < snark_scalar_field, "verifier-gte-snark-scalar-field");
      vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
    }
    vk_x = Pairing.addition(vk_x, vk.IC[0]);
    if (!Pairing.pairingProd4(Pairing.negate(proof.A), proof.B, vk.alfa1, vk.beta2, vk_x, vk.gamma2, proof.C, vk.delta2)) return 1;
    return 0;
  }

  /// @return r  bool true if proof is valid
  function verifyProof(uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[21] memory input) public view returns (bool r) {
    Proof memory proof;
    proof.A = Pairing.G1Point(a[0], a[1]);
    proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
    proof.C = Pairing.G1Point(c[0], c[1]);
    uint[] memory inputValues = new uint[](input.length);
    for (uint i = 0; i < input.length; i++) {
      inputValues[i] = input[i];
    }
    if (verify(inputValues, proof) == 0) {
      return true;
    } else {
      return false;
    }
  }
}
