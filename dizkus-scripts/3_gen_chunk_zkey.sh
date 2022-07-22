#!/bin/bash

CIRCUIT_NAME=dizkus_64_4_30
BUILD_DIR="../build/$CIRCUIT_NAME"
R1CS_FILE="$BUILD_DIR/$CIRCUIT_NAME.r1cs"
PARTIAL_ZKEYS="$BUILD_DIR"/partial_zkeys
PHASE1=../circuits/pot21_final.ptau

if [ ! -d "$BUILD_DIR"/partial_zkeys ]; then
    echo "No partial_zkeys directory found. Creating partial_zkeys directory..."
    mkdir -p "$BUILD_DIR"/partial_zkeys
fi

echo "****GENERATING ZKEY 0****"
start=`date +%s`
set -x
../node_modules/.bin/snarkjs groth16 setup "$R1CS_FILE" "$PHASE1" "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_0.zkey
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo

echo "****GENERATING ZKEY 1****"
start=`date +%s`
set -x
../node_modules/.bin/snarkjs zkey contribute "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_0.zkey "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_1.zkey --name="1st Contributor Name" -v
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo

echo "****GENERATING ZKEY 2****"
start=`date +%s`
set -x
../node_modules/.bin/snarkjs zkey contribute "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_1.zkey "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_2.zkey --name="2nd Contributor Name" -v
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo

# Use merkle root of Vivek + Lakshman MIMC merkle tree
echo "****GENERATING FINAL ZKEY****"
start=`date +%s`
set -x
../node_modules/.bin/snarkjs zkey beacon "$PARTIAL_ZKEYS"/"$CIRCUIT_NAME"_2.zkey "$BUILD_DIR"/"$CIRCUIT_NAME".zkey 12FE2EC467BD428DD0E966A6287DE2AF8DE09C2C5C0AD902B2C666B0895ABB75 10 -n="Final Beacon phase2"
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo