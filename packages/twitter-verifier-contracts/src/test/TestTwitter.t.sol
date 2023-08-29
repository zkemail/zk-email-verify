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
        publicSignals[0] = 12431732230788297063498039481224031586256793440953465069048041914965586355958;
        publicSignals[1] = 28557011619965818;
        publicSignals[2] = 1818845549;
        publicSignals[3] = 0;
        publicSignals[4] = 706787187238086675321187262313978339498517045894;

        uint256[2] memory proof_a = [
            133962017860624283717213706649367569567629135450196636508881687850871307586,
            21817577147834544582541815668274019263901666173816210586889983408251878002083
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                8595689991179881035451367414169539261142341305299599688613778448622346700557,
                4809837661107420670485529034983751551646798248871990229596872017366733419934
            ],
            [
                12013354494645343175415057957272667444344542259008932856974115285427580734508,
                6862830458045229879966674995484458163206296920829065118479022071748247878381
            ]
        ];
        uint256[2] memory proof_c = [
            19531968997158860147868436835414725562564553364039986323866587266295465327105,
            11139264701052381809362943228865135490994937830868735017256007639162305733366
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
        publicSignals[0] = 12431732230788297063498039481224031586256793440953465069048041914965586355958; // DKIM hash
        publicSignals[1] = 30510783769178975;
        publicSignals[2] = 0;
        publicSignals[3] = 0;
        publicSignals[4] = 1163446621798851219159656704542204983322218017645; // Wallet address

        // TODO switch order
        uint256[2] memory proof_a = [
            16127707542426371151122326639711465090904755573151809113616540556589160522447,
            9241978512220848525435217733468073937824585827323302722589508703971297194281
        ];
        // Note: you need to swap the order of the two elements in each subarray
        uint256[2][2] memory proof_b = [
            [
                15333084254396703660994729348937677811457063576875427303003032623488185079473,
                15014641442362723399657087243149694421989170600421809623849643826310032658025
            ],
            [
                5559178075969036974910113101281763021277875619876196470933834569599005611330,
                11385229689579886716887516195548401192764827094668156045127600119379998542450
            ]
        ];
        uint256[2] memory proof_c = [
            12054632487380840870275694407072950658705930291252275419700909395481150775549,
            10617950585124825416593524172786731431469104516944242135787471975701361474847
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
        vm.startPrank(0x6171aeBcC9e9B9E1D90EC9C2E124982932297345);
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
