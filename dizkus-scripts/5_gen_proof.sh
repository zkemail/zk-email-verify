#!/bin/bash

source circuit.env

echo "****GENERATING PROOF FOR SAMPLE INPUT****"
start=$(date +%s)
set -x
NODE_OPTIONS='--max-old-space-size=644000' ../node_modules/.bin/snarkjs groth16 prove "$BUILD_DIR"/"$CIRCUIT_NAME".zkey "$BUILD_DIR"/witness.wtns "$BUILD_DIR"/proof.json "$BUILD_DIR"/public.json
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo

echo "****VERIFYING PROOF FOR SAMPLE INPUT****"
start=$(date +%s)
set -x
NODE_OPTIONS='--max-old-space-size=644000' ../node_modules/.bin/snarkjs groth16 verify "$BUILD_DIR"/vkey.json "$BUILD_DIR"/public.json "$BUILD_DIR"/proof.json
end=$(date +%s)
{ set +x; } 2>/dev/null
echo "DONE ($((end - start))s)"
echo
