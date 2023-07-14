#!/bin/bash
source circuit.env

if [ ! -d "$BUILD_DIR" ]; then
    echo "No build directory found. Creating build directory..."
    mkdir -p "$BUILD_DIR"
fi

echo '****COMPILING CIRCUIT****'
start=$(date +%s)
set -x
circom "../$CIRCUIT_NAME".circom --r1cs --wasm --sym --c --wat --output "$BUILD_DIR"
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo

echo '****INSPECTING CIRCUIT FOR UNDERCONSTRAINTS (OPTIONAL, CAN FORCE EXIT)****'
start=$(date +%s)
set -x
circom "../$CIRCUIT_NAME".circom --inspect
{ set +x; } 2>/dev/null
end=$(date +%s)
echo "DONE ($((end - start))s)"
echo
