#!/bin/bash

CIRCUIT_NAME=email
BUILD_DIR="../build/$CIRCUIT_NAME"

echo "****GENERATING WITNESS FOR SAMPLE INPUT****"
start=`date +%s`
set -x
node "$BUILD_DIR"/"$CIRCUIT_NAME"_js/generate_witness.js "$BUILD_DIR"/"$CIRCUIT_NAME"_js/"$CIRCUIT_NAME".wasm ../circuits/inputs/input_twitter.json "$BUILD_DIR"/witness.wtns
{ set +x; } 2>/dev/null
end=`date +%s`
echo "DONE ($((end-start))s)"
echo
