#!/bin/bash

CIRCUIT_NAME=email
BUILD_DIR="../build/$CIRCUIT_NAME"
R1CS_FILE="$BUILD_DIR/$CIRCUIT_NAME.r1cs"
PARTIAL_ZKEYS="$BUILD_DIR"/partial_zkeys
PHASE1=../circuits/powersOfTau28_hez_final_22.ptau

if [ ! -d "$BUILD_DIR"/partial_zkeys ]; then
    echo "No partial_zkeys directory found. Creating partial_zkeys directory..."
    mkdir -p "$BUILD_DIR"/partial_zkeys
fi

echo "****GENERATING ZKEY 0****"
start=`date +%s`
set -x
NODE_OPTIONS='--max-old-space-size=56000' node ../node_modules/.bin/snarkjs groth16 setup "$R1CS_FILE" "$PHASE1" "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_0.zkey
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo

echo "****GENERATING ZKEY 1****"
start=`date +%s`
set -x
NODE_OPTIONS='--max-old-space-size=56000' node ../node_modules/.bin/snarkjs zkey contribute "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_0.zkey "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_1.zkey --name="1st Contributor Name" -v
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo

# echo "****GENERATING ZKEY 2****"
# start=`date +%s`
# set -x
# NODE_OPTIONS='--max-old-space-size=56000' node ../node_modules/.bin/snarkjs zkey contribute "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_1.zkey "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_2.zkey --name="2nd Contributor Name" -v
# { set +x; } 2>/dev/null
# end=`date +%s`
# echo "DONE ($((end-start))s)"
# echo

# Use merkle root of Vivek + Lakshman MIMC merkle tree
echo "****GENERATING FINAL ZKEY****"
start=`date +%s`
set -x
# hashlib.sha256(b"sampritiaayush").hexdigest().upper()
NODE_OPTIONS='--max-old-space-size=56000' node ../node_modules/.bin/snarkjs zkey beacon "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_1.zkey "$BUILD_DIR"/"$CIRCUIT_NAME".zkey AFAE5390CE7790A5EFA03DD74189A4C56DDA1AB8D3D322142C4AE3A14858D6E0 10 -n="Final Beacon phase2"
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo