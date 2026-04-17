// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {console2 as console} from "forge-std/console2.sol";
import {HonkVerifierSCALE1} from "../src/verifiers/HonkVerifierSCALE1.sol";
import {HonkVerifierSCALE4} from "../src/verifiers/HonkVerifierSCALE4.sol";
import {HonkVerifierSCALE7} from "../src/verifiers/HonkVerifierSCALE7.sol";

interface IHonk {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

contract GasBenchHonk is Test {
    function _loadPublicInputs(string memory cfg) internal view returns (bytes32[] memory pubs) {
        bytes memory raw = vm.readFileBinary(string.concat("fixtures/honk/", cfg, ".public_inputs.bin"));
        require(raw.length % 32 == 0, "public_inputs length not multiple of 32");
        pubs = new bytes32[](raw.length / 32);
        for (uint256 i = 0; i < pubs.length; i++) {
            bytes32 word;
            assembly { word := mload(add(add(raw, 0x20), mul(i, 0x20))) }
            pubs[i] = word;
        }
    }

    function _measure(string memory cfg, IHonk v) internal view {
        bytes memory proof = vm.readFileBinary(string.concat("fixtures/honk/", cfg, ".proof.bin"));
        bytes32[] memory pubs = _loadPublicInputs(cfg);
        uint256 g0 = gasleft();
        bool ok = v.verify(proof, pubs);
        uint256 gasUsed = g0 - gasleft();
        assertTrue(ok, "verify failed");
        console.log("HONK", cfg, "gas", gasUsed);
        console.log("HONK", cfg, "bytecode", address(v).code.length);
    }

    function testHonk_SCALE1() public { _measure("SCALE-1", IHonk(address(new HonkVerifierSCALE1()))); }
    function testHonk_SCALE4() public { _measure("SCALE-4", IHonk(address(new HonkVerifierSCALE4()))); }
    function testHonk_SCALE7() public { _measure("SCALE-7", IHonk(address(new HonkVerifierSCALE7()))); }
}
