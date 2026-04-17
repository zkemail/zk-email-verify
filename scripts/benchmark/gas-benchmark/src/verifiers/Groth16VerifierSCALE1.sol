// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16VerifierSCALE1 {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;

    
    uint256 constant IC0x = 8647987301602986310299638992709144724957105146400359400581845560733316053443;
    uint256 constant IC0y = 4611030307300716845688404875634147119257811607279352211470482574571430416699;
    
    uint256 constant IC1x = 9125755068555770913512553687831706026647242735625660060063311039600976395907;
    uint256 constant IC1y = 2222244264036738131997826027132492761294494698298954357785127842530321491949;
    
    uint256 constant IC2x = 1640280185116369337248072107420733876400467889764217579564422123554817286229;
    uint256 constant IC2y = 1309055878666050488582491120424443365698464013185609689097456888946166732902;
    
    uint256 constant IC3x = 16642682959435631894007210919677481018003024313524897719310642448935378577076;
    uint256 constant IC3y = 10951937173415984969705805468565797884725969262764368919722902723183665835648;
    
    uint256 constant IC4x = 7357800349744452795449645772287263241463777027088951673735633048273478381647;
    uint256 constant IC4y = 1970658155620806549766995511273555254652273595992129117206437824435599883438;
    
    uint256 constant IC5x = 3513058510580215424884784548801702893934760893107622150810584386060869765614;
    uint256 constant IC5y = 17729104088179989862121286240124926991635690390094646654341879625754112938619;
    
    uint256 constant IC6x = 20186305279897379820085091230453074149471416335680983037663201475521287712430;
    uint256 constant IC6y = 12574144294590356439137625517263034423717115894439881096373986457969192571975;
    
    uint256 constant IC7x = 5159825748821049978133696516258882202389818459565175079121096221207493829358;
    uint256 constant IC7y = 10167566500873404473053528229903181621968714619373092808633460860426048116904;
    
    uint256 constant IC8x = 11788730166451574555840449351095185284555983764226828970904310743780659741174;
    uint256 constant IC8y = 10365273153540442120107775938265389926698430540263827179148952147348737716043;
    
    uint256 constant IC9x = 20962626922567643992832113475074254255635433058047610353868240918818236272038;
    uint256 constant IC9y = 19495712665564480708007110083750940019779054866095066211384075014363553206675;
    
    uint256 constant IC10x = 10859552675595942115832435931336392742786705281306178964233639741176796275225;
    uint256 constant IC10y = 7408184906150358336805053081904548239820465436654138286283450457920267724792;
    
    uint256 constant IC11x = 15197569437059071510117968573625235110673624250408367042727527300376754265651;
    uint256 constant IC11y = 2685379883735009742862332216445972115490110883321848049326933172134561182880;
    
    uint256 constant IC12x = 21664818329520631617743405079506975477642206332107147348643969438919691204697;
    uint256 constant IC12y = 3850597546516418498978347258730762120595859859656214072493389082479295638793;
    
    uint256 constant IC13x = 18453410398335800621376561426618324889254954727173248323319290593729195146525;
    uint256 constant IC13y = 5068525487820097275986968033749879062630981449407289128431770413073784097705;
    
    uint256 constant IC14x = 15204853808279034711372787059689813458179859559316847712208481139941403900711;
    uint256 constant IC14y = 19769073123249206580551681174680430310532970379924965044993336564739271186782;
    
    uint256 constant IC15x = 8498323269464428518104412735317031918431757937400073588820077723735447265065;
    uint256 constant IC15y = 3418573068983708359019193882114426091140847703819426998665769670172338286634;
    
    uint256 constant IC16x = 13001432659419343753725550321220668019930076753397999525229120249494750525703;
    uint256 constant IC16y = 21793566864434832933760151680064951636409569724257552980453723311214525385983;
    
    uint256 constant IC17x = 11884175036484365128159929795983285385255562402974433480524650883978215173560;
    uint256 constant IC17y = 5071749712001234120819060712757103031383785786650628422487359859656958594787;
    
    uint256 constant IC18x = 14943862153449416871129701760681456760998940952056199569970536082791032994169;
    uint256 constant IC18y = 10253421772044251913027031153339920954973329800219899433709674949399011094460;
    
    uint256 constant IC19x = 127652335977001651154252981477031740857102357385289138451333304755184981551;
    uint256 constant IC19y = 6059608571368233788496465030611271048741224851499676465760413013605208971790;
    
    uint256 constant IC20x = 3439997673210402672216534452185886985790921383654657863618707540327755372700;
    uint256 constant IC20y = 5038454375402315552747319002736009395238307141105548338745966377739274130487;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[20] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
