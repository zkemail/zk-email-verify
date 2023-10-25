#!/bin/bash

source circuit.env

# echo "****MAKE CPP FILE FOR WITNESS GENERATION****"
# start=$(date +%s)
# set -x
# make -C "$BUILD_DIR"/"$CIRCUIT_NAME"_cpp/
# { set +x; } 2>/dev/null
# end=$(date +%s)
# echo "DONE ($((end - start))s)"
# echo

# echo "****GENERATING WITNESS FOR SAMPLE INPUT****"
# start=`date +%s`
# set -x
# ./"$BUILD_DIR"/"$CIRCUIT_NAME"_cpp/"$CIRCUIT_NAME" input_"$CIRCUIT_NAME".json "$BUILD_DIR"/witness.wtns
# { set +x; } 2>/dev/null
# end=`date +%s`
# echo "DONE ($((end-start))s)"
# echo

echo "****GENERATING PROOF FOR SAMPLE INPUT****"
start=$(date +%s)
set -x
./../../rapidsnark/build/prover "$BUILD_DIR"/"$CIRCUIT_NAME".zkey "$BUILD_DIR"/witness.wtns "$BUILD_DIR"/rapidsnark_proof.json "$BUILD_DIR"/rapidsnark_public.json
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo
