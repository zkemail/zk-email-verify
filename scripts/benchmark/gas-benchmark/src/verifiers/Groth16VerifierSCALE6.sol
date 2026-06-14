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

contract Groth16VerifierSCALE6 {
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

    
    uint256 constant IC0x = 9960477534874749975542329560934432507245551315579382470571392943585495500943;
    uint256 constant IC0y = 1782518544398891290337347220491647293697118972197666862736004458744916456810;
    
    uint256 constant IC1x = 12653248297130722185185726704346466570018905151004056377893462931346909237190;
    uint256 constant IC1y = 10615407343434076561000596231087748977618463037536540522170065401172237274918;
    
    uint256 constant IC2x = 21858998415322435155084801664953019565064137376476064701855371904275793247445;
    uint256 constant IC2y = 5075253832504640363628432454992392500012880048961704905406298225261666661881;
    
    uint256 constant IC3x = 7136761472617635781315493123132676737910115519442431646217013786145109542147;
    uint256 constant IC3y = 7577993320755192802018382874863893094465607249715019451589124157414417571542;
    
    uint256 constant IC4x = 21870863326209310561463189701842673206728209911989825909733342203096009912069;
    uint256 constant IC4y = 3046804338802597525669088191134021051157087661751645207990379088751893902629;
    
    uint256 constant IC5x = 5200244709931304965300653580022928870332418617840599873934724226157873700785;
    uint256 constant IC5y = 12879858872507152414295683385173366283259946270388655445607719614896235657210;
    
    uint256 constant IC6x = 4007539121132110515673677879562988607115842209656834387385432390812466927666;
    uint256 constant IC6y = 2571577442371450199183407849857924288125704762851268987427477201196592450686;
    
    uint256 constant IC7x = 15681052637757475071652880820330573802298762327094673695879589906751801985219;
    uint256 constant IC7y = 19000120036340095892458604091391379013410325277387323715046999378666979273196;
    
    uint256 constant IC8x = 13514039054730791871141343278175277621719000049569710326756534275644931887609;
    uint256 constant IC8y = 2048668566177378384199972198079427405520088596581216419896745190028032070272;
    
    uint256 constant IC9x = 13160069134045225488852672018754624209557255602595406034953140739721625367371;
    uint256 constant IC9y = 4941086451846843791702358785116944127050861366639201380106757597804351809778;
    
    uint256 constant IC10x = 19997198208722891857599296823406839725204634805405745365223480911245959482543;
    uint256 constant IC10y = 20668816765853638673222591232393908127041212966802643258500326386681999061226;
    
    uint256 constant IC11x = 18998529097580081908831537601013712122755698552064429007206384688705587041579;
    uint256 constant IC11y = 13912617270577724596000278162277716343712846593061437613551288863011647490364;
    
    uint256 constant IC12x = 15866553856121867671881450703721216519389732423124232034273640718458038168636;
    uint256 constant IC12y = 20544708371546138863001579700690579685238731881778788517589665153992086559242;
    
    uint256 constant IC13x = 11817197655420415429722161012010517637703596477027792899515458601422506021369;
    uint256 constant IC13y = 5867274353026472640298108196712067090335528013778777624298176085956533308509;
    
    uint256 constant IC14x = 17220092402114392459121980630934975882879985462718527549307873835064864041576;
    uint256 constant IC14y = 10556035872343270469646187688855350704383808624788669253569001425230145676107;
    
    uint256 constant IC15x = 20687445695196486879912792011175340074813564571988071249216805959007053613286;
    uint256 constant IC15y = 16061813315987793300474609718612359365260268117201078722683103503740953837970;
    
    uint256 constant IC16x = 1280360008074987487843082793185913002256208327016585669979667831414258295949;
    uint256 constant IC16y = 9774445110331933087776794287921599229498554415136367152868066759359884373614;
    
    uint256 constant IC17x = 16659547341416752770227565316334649518889640720189097690401135346368877118189;
    uint256 constant IC17y = 18173349894033029451335768630711212087989405650867847196040447470607223279016;
    
    uint256 constant IC18x = 3676358626674903512882040009474340050933761591654605636358826625277369991629;
    uint256 constant IC18y = 196171946511026016899788535561962116408129830502412872692970828010227071992;
    
    uint256 constant IC19x = 21467249601215736371583386390989746252771981652705747074169805821811016370913;
    uint256 constant IC19y = 18647866740817465430126394910731806245830540458813835886767166297219935289282;
    
    uint256 constant IC20x = 18223512792189049228074808576535440602197084242100754356796155576001303056617;
    uint256 constant IC20y = 14760538494743537030994328836370805034923587273015067777434973934737016064123;
    
 
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
