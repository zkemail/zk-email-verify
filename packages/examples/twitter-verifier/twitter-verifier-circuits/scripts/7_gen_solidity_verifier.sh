#!/bin/bash

source circuit.env


echo "****GENERATING SOLIDITY VERIFIER FOR ZKEY****"
start=$(date +%s)
set -x
NODE_OPTIONS='--max-old-space-size=644000' ../node_modules/.bin/snarkjs zkey export solidityverifier "$BUILD_DIR"/"$CIRCUIT_NAME".zkey ../contracts/verifier.sol
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo
