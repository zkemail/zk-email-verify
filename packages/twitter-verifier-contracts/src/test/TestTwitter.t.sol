pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@zk-email/contracts/DKIMRegistry.sol";
import "../TwitterEmailHandler.sol";
import "../Groth16VerifierTwitter.sol";

contract TwitterUtilsTest is Test {
    using StringUtils for *;

    address constant VM_ADDR = 0x7109709ECfa91a80626fF3989D68f67F5b1DD12D; // Hardcoded address of the VM from foundry

    Verifier proofVerifier;
    DKIMRegistry dkimRegistry;
    VerifiedTwitterEmail testVerifier;

    uint16 public constant packSize = 7;

    function setUp() public {
        proofVerifier = new Verifier();
        dkimRegistry = new DKIMRegistry();
        testVerifier = new VerifiedTwitterEmail(proofVerifier, dkimRegistry);
    }

    // function testMint() public {
    //   testVerifier.mint
    // }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testUnpack1() public {
        uint256[] memory packedBytes = new uint256[](3);
        packedBytes[0] = 29096824819513600;
        packedBytes[1] = 0;
        packedBytes[2] = 0;

        // This is 0x797573685f670000000000000000000000000000000000000000000000000000
        // packSize = 7
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 15, packSize);
        // This is 0x797573685f67, since strings are internally arbitrary length arrays
        string memory intended_value = "yush_g";

        // We need to cast both to bytes32, which works since usernames can be at most 15, alphanumeric + '_' characters
        // Note that this may not generalize to non-ascii characters.
        // Weird characters are allowed in email addresses, see https://en.wikipedia.org/wiki/Email_address#Local-part
        // See https://stackoverflow.com/a/2049510/3977093 -- you can even have international characters with RFC 6532
        // Our regex should just disallow most of these emails, but they may end up taking more than two bytes
        // ASCII should fit in 2 bytes but emails may not be ASCII
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        assertEq(byteList, intended_value);
        console.logString(byteList);
    }

    function testUnpack2() public {
        uint256[] memory packedBytes = new uint256[](3);
        packedBytes[0] = 28557011619965818;
        packedBytes[1] = 1818845549;
        packedBytes[2] = 0;
        string memory byteList = StringUtils.convertPackedBytesToString(packedBytes, 15, packSize);
        string memory intended_value = "zktestemail";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testVerifyTestEmail() public {
        uint256[5] memory publicSignals;
        publicSignals[0] = 5857406240302475676709141738935898448223932090884766940073913110146444539372;
        publicSignals[1] = 28557011619965818;
        publicSignals[2] = 1818845549;
        publicSignals[3] = 0;
        publicSignals[4] = 0;

        uint256[2] memory proof_a = [
            3649334755569831907195520428833223867325566261927662850697457548576548541399,
            20499460910231109259355812649801775326681878390015543064856133800701501255403
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                18350509772374090875478186427591896475635971401417632667703989186821213732907,
                20920114183638997246250474302534489120211558454058706857869471742330436930623
            ],
            [
                20833324547309395598049634278012419609902774577170241984625358609703786913471,
                4785607205750561958206192558685274396831815058929208114308096742945548253150
            ]
        ];
        uint256[2] memory proof_c = [
            18541471899472993603764612117992065692236194406154776508711447996685912128129,
            18293183002901335551240602175803470788428633072792368323293246337532330600419
        ];

        uint256[8] memory proof = [
            proof_a[0],
            proof_a[1],
            proof_b[0][0],
            proof_b[0][1],
            proof_b[1][0],
            proof_b[1][1],
            proof_c[0],
            proof_c[1]
        ];

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test mint after spoofing msg.sender
        Vm vm = Vm(VM_ADDR);
        vm.startPrank(0x0000000000000000000000000000000000000001);
        testVerifier.mint(proof, publicSignals);
        vm.stopPrank();
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testVerifyYushEmail() public {
        uint256[5] memory publicSignals;
        publicSignals[0] = 5857406240302475676709141738935898448223932090884766940073913110146444539372; // DKIM hash
        publicSignals[1] = 28557011619965818;
        publicSignals[2] = 1818845549;
        publicSignals[3] = 0;
        publicSignals[4] = 706787187238086675321187262313978339498517045894; // Wallet address

        // TODO switch order
        uint256[2] memory proof_a = [
            19817492339401278465118121019448349479859144740707433510837170782894149706567,
            15749628588921306470037688834174003557365460195275885180096519684182988993851
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                9445954524163501509323374709856803201722448233533184553724049008118035508127,
                142095833772938065131103402668070554947744431473673314140149330287323466706
            ],
            [
                18208536814044026568200697428816501374520119192737872922858886575185380278853,
                7254444262876114770206692341372538312518785956834239213367767335479093449856
            ]
        ];
        uint256[2] memory proof_c = [
            3882923767928427172202563836745259073814708409183251252709845187636427784165,
            7429146966844533533925641512762548303501115923920311043478436173514135368876
        ];

        uint256[8] memory proof = [
            proof_a[0],
            proof_a[1],
            proof_b[0][0],
            proof_b[0][1],
            proof_b[1][0],
            proof_b[1][1],
            proof_c[0],
            proof_c[1]
        ];

        // Test proof verification
        bool verified = proofVerifier.verifyProof(proof_a, proof_b, proof_c, publicSignals);
        assertEq(verified, true);

        // Test mint after spoofing msg.sender
        Vm vm = Vm(VM_ADDR);
        vm.startPrank(0x7Bcd6F009471e9974a77086a69289D16EaDbA286);
        testVerifier.mint(proof, publicSignals);
        vm.stopPrank();
    }

    function testSVG() public {
        testVerifyYushEmail();
        testVerifyTestEmail();
        string memory svgValue = testVerifier.tokenURI(1);
        console.log(svgValue);
        assert(bytes(svgValue).length > 0);
    }

    function testChainID() public view {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        console.log(chainId);
        // Local chain, xdai, goerli, mainnet
        assert(chainId == 31337 || chainId == 100 || chainId == 5 || chainId == 1);
    }
}
