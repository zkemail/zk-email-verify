#!/bin/bash

CIRCUIT_NAME=dizkus_64_4_30
BUILD_DIR="../build/$CIRCUIT_NAME"
R1CS_FILE="$BUILD_DIR/$CIRCUIT_NAME.r1cs"
PHASE1=../circuits/pot21_final.ptau

echo "****EXPORTING VKEY****"
start=`date +%s`
set -x
../node_modules/.bin/snarkjs zkey export verificationkey "$BUILD_DIR"/"$CIRCUIT_NAME".zkey "$BUILD_DIR"/vkey.json
end=`date +%s`
{ set +x; } 2>/dev/null
echo "DONE ($((end-start))s)"
echo