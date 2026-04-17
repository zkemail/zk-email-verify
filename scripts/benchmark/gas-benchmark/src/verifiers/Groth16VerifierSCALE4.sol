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

contract Groth16VerifierSCALE4 {
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

    
    uint256 constant IC0x = 20903152184013585122383933774438763898850555724636342757969700630849697442430;
    uint256 constant IC0y = 14373575077914972678244141133003057533703830546604929597143099136033088659572;
    
    uint256 constant IC1x = 19628420702000536633267180597681386325080766211081572932726724286094501435443;
    uint256 constant IC1y = 799488625629641404978872422755571038577523409975373558255883979275967183898;
    
    uint256 constant IC2x = 1811987864549695674040346802623580295508280898035884618297441691062536808427;
    uint256 constant IC2y = 4769271034419425162594304154222136202165807287789623556887145311111368693023;
    
    uint256 constant IC3x = 10480970660739892922510857364007650959381397324489636961068534578913200053862;
    uint256 constant IC3y = 10702879251126074257896669158307447313933009020340568906203287702560809563641;
    
    uint256 constant IC4x = 11554999292531152309880403277617482892442598346087587181847168931356405704701;
    uint256 constant IC4y = 19849553220444466945753928744108777951338326712192404388430013527691019458262;
    
    uint256 constant IC5x = 3391084529910486275321632689034396279615869860654121204034981486381073340663;
    uint256 constant IC5y = 11132556643206578767056230267397903849557991518039997268546246252828774161211;
    
    uint256 constant IC6x = 850274086547133263206199295096395935601689599280159194984430074783926570551;
    uint256 constant IC6y = 19314036138707552455216585974243322667684617588993732426325195155462891228471;
    
    uint256 constant IC7x = 20832069915736938425492844438902954177445009729242790424232077006486763986750;
    uint256 constant IC7y = 3932540857892794157244949381944876492326843467046461857916877264657875124171;
    
    uint256 constant IC8x = 532122488198029387729767672598089102443882773610467602144346740852185096633;
    uint256 constant IC8y = 14633395185923139711730475227816780182921460681367598734787192517188363865011;
    
    uint256 constant IC9x = 1451838451805824202375913199764514784508215174218200043324314591161029716585;
    uint256 constant IC9y = 18592848107182073028515830951681009349441137098106639156263680274620302242710;
    
    uint256 constant IC10x = 8679885488947534601726174062010415804509937315142249966561596413344001125612;
    uint256 constant IC10y = 20021343272626406571547416082330765663589374265587198946081696833177434935901;
    
    uint256 constant IC11x = 4610587669000459410924966644444475479141506330655375634365693326655870010160;
    uint256 constant IC11y = 7688029640297607935083470676132049036403062203702256125299314098005277024918;
    
    uint256 constant IC12x = 18624156307838868568069741946557035780908248307273659561338541691174997484416;
    uint256 constant IC12y = 11749340440624165229436991920260576020030904384525310547862046875113193979398;
    
    uint256 constant IC13x = 13860835631943534538648804562074349793185224874447537488160167235872897818537;
    uint256 constant IC13y = 7354835292326877056773048064003317176180545423364941696477509480035945816674;
    
    uint256 constant IC14x = 19629637458094115481626324841494393994622270943203305496118999813327528578748;
    uint256 constant IC14y = 13842562913375838753528462725066269213142021767597123702748217493739033830004;
    
    uint256 constant IC15x = 8420201783308222933991834544877720130625217536692085586007759151727351623229;
    uint256 constant IC15y = 14423693546654287858371802319501614661793646912025640270105266239305373643438;
    
    uint256 constant IC16x = 12860623247074863574400672878535833888142858059529892686329001644199003919790;
    uint256 constant IC16y = 107508550830383299201641393950073889194514825248473844468812824997763356642;
    
    uint256 constant IC17x = 21034871460718025449679470214586278037287889213328231446340139268619961121481;
    uint256 constant IC17y = 11060400102955451864494125584701120885195073542772635017122267533521962578928;
    
    uint256 constant IC18x = 131486599134439123555473543185279087616388909889071495632426886308637390715;
    uint256 constant IC18y = 16098826541500512938239302749229120439527326138110460476388042125195485013288;
    
    uint256 constant IC19x = 13699919438963589773294629404704022944989660544833787067780395608319748035113;
    uint256 constant IC19y = 9201691871766522666559813702036370449740001299516892567067199622522753766278;
    
    uint256 constant IC20x = 13548305826496420982338499789283375239248420858402243109687860194984694235523;
    uint256 constant IC20y = 21870510924568523420031870514748270293892629804400758265190778323324303960208;
    
 
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
