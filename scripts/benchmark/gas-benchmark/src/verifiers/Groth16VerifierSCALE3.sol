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

contract Groth16VerifierSCALE3 {
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

    
    uint256 constant IC0x = 15583672950635895029900452071480730268584290462819883585504149565189725964753;
    uint256 constant IC0y = 12349915327189716413421857147470119859489177594806660395058735603596978216525;
    
    uint256 constant IC1x = 7561880600702287964402400889645769975194389288069779380013775175330335130858;
    uint256 constant IC1y = 9105439108329693827233285874484268525463654085484407385128078647042287343004;
    
    uint256 constant IC2x = 19187416726462579304503507690606843890752394122138805141613540865574200371109;
    uint256 constant IC2y = 26082505268780891490883723720239721259382111776727376429176874695072364682;
    
    uint256 constant IC3x = 7367018308918044090894955133183153980223816994007874122641645870028034225166;
    uint256 constant IC3y = 1496819558613392109210846771756734926242981648601824802396395042023510622426;
    
    uint256 constant IC4x = 982031645273118738599816898510226869886375375911723897583619261664193789291;
    uint256 constant IC4y = 9461750700394097693835304722887466628139070889232546466828619081634341191025;
    
    uint256 constant IC5x = 8950572911551912354989491742956417583953213789486075739056602271190479718153;
    uint256 constant IC5y = 18690030312844668450592912298956733804131361201730493407541911718924268441901;
    
    uint256 constant IC6x = 8234158064404719035876672052019589810529648169916390067595835037745456308838;
    uint256 constant IC6y = 1973414519667105319399856838329809987073993090934491963507757800881148463920;
    
    uint256 constant IC7x = 1634395007411006454034706898010500431507160208989193346038158019255936281671;
    uint256 constant IC7y = 15540314820818574906148080458238696770122118844244725898721543438048379824787;
    
    uint256 constant IC8x = 17946386460685587349020254511279445333910570544035297416572823120986542904164;
    uint256 constant IC8y = 15250517152123901470339809123981099500122118642496920351417589795934074328657;
    
    uint256 constant IC9x = 11277969262849174225167115924018656396516781200521674031676776391249465189674;
    uint256 constant IC9y = 15063378456290826238008882592113744997257821534862783196397120703266818954214;
    
    uint256 constant IC10x = 1451873867375066149861625886257179578988539416421510768710051238687922603333;
    uint256 constant IC10y = 1596825577587577291593506944231173104265433936523343289130043396648646897721;
    
    uint256 constant IC11x = 21395649641371212186557734417337739840636107130669189386010018218448245214455;
    uint256 constant IC11y = 14154827035702912984343977975038294373561364559958514550408991782868007293416;
    
    uint256 constant IC12x = 21665187976812981241619104811429638384390270220307313839336002600320965852834;
    uint256 constant IC12y = 3604893345449810663904422909939877141879472701730410906302268657903141278178;
    
    uint256 constant IC13x = 18487714115375047887270761155175344785030225558733098740005470876160615749762;
    uint256 constant IC13y = 9819780043866578761102977775104971902859711816374459068768906443977813130459;
    
    uint256 constant IC14x = 11783079077582826432050812852389378906104091518977919535649084381894430491577;
    uint256 constant IC14y = 3316079446472861332773085047872840294167509135866376393091291675586683141077;
    
    uint256 constant IC15x = 11716994243078837766981939099925097921683965336872028756198738305718716906468;
    uint256 constant IC15y = 13236666714436435289130679282114963078277231568098486676395640828492675164873;
    
    uint256 constant IC16x = 14800481360293522563518728172234745605542535086433709313238786926606004866484;
    uint256 constant IC16y = 16080148254282759799994338086762481218969757086293504330445140536060256942922;
    
    uint256 constant IC17x = 13288382360498151238723424237068244295144933125422387958996181450757501698722;
    uint256 constant IC17y = 13223193322675594010264112403690511718656162946424241717586090817354540724458;
    
    uint256 constant IC18x = 41250213990207133924598530633619180806405394490187014301979415127570171685;
    uint256 constant IC18y = 19532759012586106762217712528975956097118954678864984554204093949533086978153;
    
    uint256 constant IC19x = 11523652109337877664297444227985566277986891798752728849682853602667379197535;
    uint256 constant IC19y = 20616515457811452491815025210114616971000031045885361280342386435971413720438;
    
    uint256 constant IC20x = 14772727740927279383095416228197208309343040922132723746819748437064033650557;
    uint256 constant IC20y = 1594634108120865386929699506189042525266838382204860695165697397787615043361;
    
 
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
