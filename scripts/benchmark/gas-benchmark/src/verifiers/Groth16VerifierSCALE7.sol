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

contract Groth16VerifierSCALE7 {
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

    
    uint256 constant IC0x = 3074267891040313825039930031998191665914701526754724586113701140514693220356;
    uint256 constant IC0y = 8669062992144168523138265565909661147714176859508761392743041937234369508770;
    
    uint256 constant IC1x = 4863591928662258792641399531394944960148757831681562050851137924102919127502;
    uint256 constant IC1y = 34967561771228588663856337793722240501392252084238079150428405533956359370;
    
    uint256 constant IC2x = 8653498108506768901935102792022345465615592621032531720912430072512737880946;
    uint256 constant IC2y = 10505739482600045079026773534591608823470043146651111275215838924231792440804;
    
    uint256 constant IC3x = 19521526951898688320516260654621728343313145745986210605408984594275184615607;
    uint256 constant IC3y = 21517038376741991897127083735019568014879983224720648795946192341593106528294;
    
    uint256 constant IC4x = 16939157022585312902586469493418339533605583077902464545269110163350735104458;
    uint256 constant IC4y = 14929678647318491607802953801536339073111939985982770956937251479438847032953;
    
    uint256 constant IC5x = 19816518382612981686513010515583951300989957912857087551394809129174937317551;
    uint256 constant IC5y = 3716002574435445167387923831668089249466431563754842328956472996780501610410;
    
    uint256 constant IC6x = 6396829763171811932540686899492749684115311373420312133873267038623670996329;
    uint256 constant IC6y = 868052359548816409254156213143010087234429631289860498328592977765484322984;
    
    uint256 constant IC7x = 7830341044397875239184370600966281799862585505373596243352588012883875973494;
    uint256 constant IC7y = 19467728613294403706897020570578319359102467140411936693650571106611014216427;
    
    uint256 constant IC8x = 12172779481431314488820434374546609652512109943053743320823826263952562484391;
    uint256 constant IC8y = 895456309478941572325505428534531105182479833256561378185782495736884143741;
    
    uint256 constant IC9x = 7025649910376045021891386453126236687889783651653087494646802479880176257851;
    uint256 constant IC9y = 6345588046439522362777755131897463807179016176225994977256525544905902401914;
    
    uint256 constant IC10x = 18757083810009563482875722425710199241957820754022876929798449155239855066098;
    uint256 constant IC10y = 6297577287266978250199556740196157595173919667714976832013609390628679214737;
    
    uint256 constant IC11x = 4105783061003576654235842700939970868286174502453250713856819494158280524242;
    uint256 constant IC11y = 6609740364264354883033756435609983052413823700442547212815638667173794701934;
    
    uint256 constant IC12x = 2502803069000664901920654975997113476081224828744031129104419113260697273550;
    uint256 constant IC12y = 10733764652039242830062891103185324183061252559137590872342758652103140637398;
    
    uint256 constant IC13x = 4159573578400055566995455422087667490790757627755960822366990599598840958680;
    uint256 constant IC13y = 7012327465624852178973378888403363684655751891903947639019843540056245357324;
    
    uint256 constant IC14x = 7956323775863874131263159328577148252310074077309504712597594600864158950437;
    uint256 constant IC14y = 909869355315882309279456173367689278663615837565810261968202567379763400961;
    
    uint256 constant IC15x = 4695307410107070503117402458343329249958470434099805600298752682460051481460;
    uint256 constant IC15y = 18186289305806449182510114968277777630447040417633821838297134964069046347162;
    
    uint256 constant IC16x = 6763900103779006581849083519254420405326809537095771331362414938342633806966;
    uint256 constant IC16y = 20067344929815794965728765201477341436782275769259399568425270830329480678019;
    
    uint256 constant IC17x = 17854584590583245128253902642891060197372531084058542549442078728111944680764;
    uint256 constant IC17y = 12190818876880128278258937048234829222457787943360912898523588603524429263019;
    
    uint256 constant IC18x = 6895420155718045994715017289717070033301043427751059547275640902429456820998;
    uint256 constant IC18y = 4095977540305492563631048930840920767853281622285217099110050699510061947341;
    
    uint256 constant IC19x = 198758079859368671159394855870832183623531091658855565175051147922648519692;
    uint256 constant IC19y = 5097125421537241132348481904056111076278618865554700542089250586863806677509;
    
    uint256 constant IC20x = 7500697529695202792211828671044323488727494823155564145075881957425173248930;
    uint256 constant IC20y = 9340858835184279010183396470612107953981642466617097359697090937418380701498;
    
 
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
