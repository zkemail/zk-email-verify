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

contract Groth16VerifierSCALE5 {
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

    
    uint256 constant IC0x = 15902241056174218079009997047820468884706568196763321787147626914148633339300;
    uint256 constant IC0y = 19337990966993896159652234838398474771466910318690159559530910971815085818215;
    
    uint256 constant IC1x = 2508434762002914391401265839343182583729085680876067638607478969434923859732;
    uint256 constant IC1y = 13094792107026230044192568557206697095502252042150980071166755356920275974141;
    
    uint256 constant IC2x = 17302154957070576560616515661084485940279856748799892001265614233044128069456;
    uint256 constant IC2y = 1603802963252924597742378243199173213864966375183968219647298749703855350152;
    
    uint256 constant IC3x = 18105829603950966469956096408225734549155276705179336307365450205137830080812;
    uint256 constant IC3y = 13788544333520854366362997825450753217525177733397515379930026815564829575459;
    
    uint256 constant IC4x = 21555789856845649369574722085852347063083483740257022541047891906826333336070;
    uint256 constant IC4y = 2957958866961377554664107531115918586987765361297555295587328745018031591337;
    
    uint256 constant IC5x = 19922282607939028689171155434815607403266840380766154075433474479004628780059;
    uint256 constant IC5y = 13267707536481306082896207733331708456818952838574566740933646041695952156386;
    
    uint256 constant IC6x = 6137148310861931071291550175030522215764150791314982600173296319769644164618;
    uint256 constant IC6y = 16592584346101986642594796612569670258258495147646471621205942842856334961743;
    
    uint256 constant IC7x = 15077681058156675372302948841344985033373400915020777512027484804213804680237;
    uint256 constant IC7y = 18292038494120829744980377372511074052462309694184595763070883346535133543458;
    
    uint256 constant IC8x = 16692255188546561424359820120055212903035207646091019093626043840555727728268;
    uint256 constant IC8y = 1296698272890818563402154349856465688651668936650529200577108937233149232925;
    
    uint256 constant IC9x = 20634361117601194167667390150904421451355982278180947558107562601264511005170;
    uint256 constant IC9y = 6077798399758951921417648690879504811108190954777018705424377669616728800508;
    
    uint256 constant IC10x = 18533864239039751490252837363916575581891368033951894861653701443342924020602;
    uint256 constant IC10y = 16337039570975305975876627856459237954541861097068485794863150143375348240400;
    
    uint256 constant IC11x = 12825691294710709036181208045316167346551688831863629779709747722456449405453;
    uint256 constant IC11y = 10876683748125985946140562119886127792763178633322085373746024666679380942814;
    
    uint256 constant IC12x = 2403505325760064445245955804732624818699027394335782472962792146615822376536;
    uint256 constant IC12y = 5811814527734696352110664435082356452872623723696520108005376106804168174461;
    
    uint256 constant IC13x = 18551233402256643401311410778219064058239151259944535706914819000592003368969;
    uint256 constant IC13y = 11370416143746404884988561766323576110293928163347437939336670165895002357346;
    
    uint256 constant IC14x = 9464107399423724232547672701771668570373964957311117916263294243736037308654;
    uint256 constant IC14y = 5357042545668448548903371104145680286832057708644892034620311659312756523346;
    
    uint256 constant IC15x = 19751555549417746356716347424975014215005862862455945520106227485465643197661;
    uint256 constant IC15y = 21000293920012036505195797895378352724170329486051199475654999319275276496071;
    
    uint256 constant IC16x = 6951241419322653026970968134246954603953037262422067810324395692371563414456;
    uint256 constant IC16y = 16222558424876255275585314268145127617553865417253610083264756274885668869139;
    
    uint256 constant IC17x = 14684983876309827412069712703590062244952984874455981821196775625277064889320;
    uint256 constant IC17y = 15308983793342221935111606281726480238600642677523470343750991775020183662000;
    
    uint256 constant IC18x = 6582587333217756212401047024886215494541817254010162841414310428154530111016;
    uint256 constant IC18y = 21039992619371868888501817128159048408892533510275664722364156050994347949703;
    
    uint256 constant IC19x = 20342652027176830848930532615809692120506100427152088870625928551280445096638;
    uint256 constant IC19y = 12152215231573836446901616792136253160035612477297353228096493547624775574678;
    
    uint256 constant IC20x = 1029032031453920802070455597498185039416586861316849418968402155739431826276;
    uint256 constant IC20y = 8868181243155753577000577009772288309395931310606115858855437523678029277844;
    
 
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
