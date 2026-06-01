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

contract Groth16VerifierSCALE2 {
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

    
    uint256 constant IC0x = 14492742554803910758976942133097328312553807694771934661012290218514951038694;
    uint256 constant IC0y = 10337547087340045376946138695417006092849061977490715761014410789047720379129;
    
    uint256 constant IC1x = 20080708322738404883227272935945585114721274232455181323382705256388293434987;
    uint256 constant IC1y = 15388611764538058482406951345238979689731435368122647759712483015782655831738;
    
    uint256 constant IC2x = 6101559505222463496839646346787218497382858479001254662903608863574346333321;
    uint256 constant IC2y = 3862149446174430323253458848815288691561760530852280450268392145740647462921;
    
    uint256 constant IC3x = 7944479379206425418573619416663529696440021786509941387488088069248055247692;
    uint256 constant IC3y = 17860956568433972683207506869728392990295813631178439326649707988296698517488;
    
    uint256 constant IC4x = 1534751731807896629042850875349779439346104816696148204182341262323659294888;
    uint256 constant IC4y = 10062084623254356537849984264515803670549835036355690849797180410655786400571;
    
    uint256 constant IC5x = 13860765207914242596409132926719237203253862576156253600572141178608743322466;
    uint256 constant IC5y = 9597669842047961265920608735735722162461606481002369263046054283186410986901;
    
    uint256 constant IC6x = 13151672198462341683924184410350070542875276730017546435767879087114901401037;
    uint256 constant IC6y = 6108534103324548311353619977091648402726036706448225744305574286329763655405;
    
    uint256 constant IC7x = 1927491210489431150603145052023565290348265088198202062249757582714389046872;
    uint256 constant IC7y = 10146757514604147474343305800147339461955536153796561569313857941701150071324;
    
    uint256 constant IC8x = 10313828306954278876643683220737273030882242228763176529957942727204408763665;
    uint256 constant IC8y = 6560056556842241542341875761418699429421323057632491265020069514543165856817;
    
    uint256 constant IC9x = 8038670809005190249757748231628312198699659164559271110987414173400764939512;
    uint256 constant IC9y = 3708749211233031547485074579141950664040487027528697161342108868190872618193;
    
    uint256 constant IC10x = 5009617830019040910319694298459666750059342411703571235565135944592693518300;
    uint256 constant IC10y = 12970757949495898804049516341763327945321010409424726964060482307407883846564;
    
    uint256 constant IC11x = 5391354301557673258727169929916050988267916673335557848721142950109260146049;
    uint256 constant IC11y = 7449550938616037180669808050932422736072999339518406760580414129877539905872;
    
    uint256 constant IC12x = 4134174848751071527456938004188832929185057633023940174849262839122865275013;
    uint256 constant IC12y = 973278675644478027026218528238753559628858687716507688117747133776498927936;
    
    uint256 constant IC13x = 9450836313901745575130720834732990245910606882820166640594728157546414230022;
    uint256 constant IC13y = 17605156114598701846869085349486068195935263148173558111827711713077906735536;
    
    uint256 constant IC14x = 7910962688367099045362212054287460206806456081526701823314619475775022950771;
    uint256 constant IC14y = 85063739189825767463737347046094253595356468555274816376010481971277692901;
    
    uint256 constant IC15x = 14472646909298455146256386756288874949929734781968969807420599385078408961730;
    uint256 constant IC15y = 12786464547093708760913332399616455804124393745881834559111081484214749462850;
    
    uint256 constant IC16x = 11860640486519448052915675875265330063264644920990171537332399949531678612774;
    uint256 constant IC16y = 8673204669489524015468559963677803954260043150487692907930920150836329015984;
    
    uint256 constant IC17x = 7195633634769785200709822078366667337935444054486884205266969195821275585704;
    uint256 constant IC17y = 2815375032969196595825242964337449622723769368573130331175860393056418470488;
    
    uint256 constant IC18x = 7651330635130530647870315682673804503927838989690655464615143618111359699766;
    uint256 constant IC18y = 19532125284141048725724552016581358089537492314025574687583440632749542624284;
    
    uint256 constant IC19x = 14859182359067793083634345505508637997876038800151546279908324929970768065558;
    uint256 constant IC19y = 15586451171228576206015749533723314156539009891534778823880289769294856031784;
    
    uint256 constant IC20x = 44799957623970264390662327471499707437877648784938433840382957082480732799;
    uint256 constant IC20y = 14072629219128257859327214273971897002302569460077106977340195036496018031083;
    
 
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
