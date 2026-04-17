// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {console2 as console} from "forge-std/console2.sol";
import {Groth16VerifierSCALE1} from "../src/verifiers/Groth16VerifierSCALE1.sol";
import {Groth16VerifierSCALE4} from "../src/verifiers/Groth16VerifierSCALE4.sol";
import {Groth16VerifierSCALE7} from "../src/verifiers/Groth16VerifierSCALE7.sol";

interface IGroth16 {
    function verifyProof(
        uint256[2] memory pA,
        uint256[2][2] memory pB,
        uint256[2] memory pC,
        uint256[20] memory pubSignals
    ) external view returns (bool);
}

contract GasBenchGroth16 is Test {
    struct Fixture {
        uint256[2] pA;
        uint256[2][2] pB;
        uint256[2] pC;
        uint256[20] pubSignals;
    }

    function _loadFixture(string memory cfg) internal view returns (Fixture memory f) {
        string memory json = vm.readFile(string.concat("fixtures/groth16/", cfg, ".json"));
        f.pA[0] = vm.parseJsonUint(json, ".pA[0]");
        f.pA[1] = vm.parseJsonUint(json, ".pA[1]");
        f.pB[0][0] = vm.parseJsonUint(json, ".pB[0][0]");
        f.pB[0][1] = vm.parseJsonUint(json, ".pB[0][1]");
        f.pB[1][0] = vm.parseJsonUint(json, ".pB[1][0]");
        f.pB[1][1] = vm.parseJsonUint(json, ".pB[1][1]");
        f.pC[0] = vm.parseJsonUint(json, ".pC[0]");
        f.pC[1] = vm.parseJsonUint(json, ".pC[1]");
        uint256[] memory pubs = vm.parseJsonUintArray(json, ".pubSignals");
        require(pubs.length == 20, "expected 20 public inputs");
        for (uint256 i = 0; i < 20; i++) f.pubSignals[i] = pubs[i];
    }

    function _measure(string memory cfg, IGroth16 v) internal view {
        Fixture memory f = _loadFixture(cfg);
        uint256 g0 = gasleft();
        bool ok = v.verifyProof(f.pA, f.pB, f.pC, f.pubSignals);
        uint256 gasUsed = g0 - gasleft();
        assertTrue(ok, "verifyProof failed");
        console.log("GROTH16", cfg, "gas", gasUsed);
        console.log("GROTH16", cfg, "bytecode", address(v).code.length);
    }

    function testGroth16_SCALE1() public { _measure("SCALE-1", IGroth16(address(new Groth16VerifierSCALE1()))); }
    function testGroth16_SCALE4() public { _measure("SCALE-4", IGroth16(address(new Groth16VerifierSCALE4()))); }
    function testGroth16_SCALE7() public { _measure("SCALE-7", IGroth16(address(new Groth16VerifierSCALE7()))); }
}
