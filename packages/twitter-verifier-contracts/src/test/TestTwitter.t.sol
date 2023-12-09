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

        dkimRegistry.setDKIMPublicKeyHash(
            "x.com",
            bytes32(uint256(5857406240302475676709141738935898448223932090884766940073913110146444539372))
        );
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
        string memory byteList = StringUtils.convertPackedBytesToString(
            packedBytes,
            15,
            packSize
        );
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
        string memory byteList = StringUtils.convertPackedBytesToString(
            packedBytes,
            15,
            packSize
        );
        string memory intended_value = "zktestemail";
        assertEq(bytes32(bytes(byteList)), bytes32(bytes(intended_value)));
        console.logString(byteList);
    }

    // Should pass (note that there are extra 0 bytes, which are filtered out but should be noted in audits)
    function testVerifyTestEmail() public {
        uint256[5] memory publicSignals;
        publicSignals[
            0
        ] = 1983664618407009423875829639306275185491946247764487749439145140682408188330; // DKIM hash
        publicSignals[1] = 131061634216091175196322682;
        publicSignals[2] = 0;


        uint256[2] memory proof_a = [
            16446392259791311871578414943828563481517059146689356547680242642281891539254,
            4278418701335985288434173802044204429481557641692518514612106766776696512791
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                10903834773277725453957963675520979653581767606477454896312873342572040921020,
                16873650057849978706467029796814006239724129773368507423484550497707624857895
            ],
            [
                11164039815265293964458222549642914968411224572760298883125076893788049631625,
                59255312247499057565624056636314029533623161100085533492475380408731104547
            ]
        ];
        uint256[2] memory proof_c = [
            14197892641725829283246692244566159270223920509313129631714184777544434821522,
            6113287322080309849455585619587770039591399338507155018076899163753155059614
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
        bool verified = proofVerifier.verifyProof(
            proof_a,
            proof_b,
            proof_c,
            publicSignals
        );
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
        publicSignals[
            0
        ] = 5857406240302475676709141738935898448223932090884766940073913110146444539372; // DKIM hash
        publicSignals[1] = 28557011619965818;
        publicSignals[2] = 1818845549;
        publicSignals[3] = 0;
        publicSignals[4] = 706787187238086675321187262313978339498517045894; // Wallet address

        // TODO switch order
        uint256[2] memory proof_a = [
            16235597139600534219471648014557261007889045173822970670513181240240086214174,
            6621518204030293388915371133361934397921786415041615077394701602185030032541
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                6161412334642964861189612033303217945413875036507487954316771559158415662599,
                6394243861551970426687159580195338783768207351061112276435055148070946593649
            ],
            [
                10941698291835179415420256896712218454699332411237939219040895798597821967702,
                7728456040917771404709714590797935142996631885733167964164791489962500861862
            ]
        ];
        uint256[2] memory proof_c = [
            14259974788240734152903966067523528600222540226580955926764767170021226788296,
            21676216180115608963745703352692727568438367369380511035841665454472016757320
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
        bool verified = proofVerifier.verifyProof(
            proof_a,
            proof_b,
            proof_c,
            publicSignals
        );
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
        assert(
            chainId == 31337 || chainId == 100 || chainId == 5 || chainId == 1
        );
    }
}
