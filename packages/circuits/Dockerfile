# Dockerfile for zk-email-verify
# Allows you to use this as a build stage to hit the zkey within rapidsnark
FROM rust:latest

ARG ZKEMAIL_BRANCH_NAME=anon_wallet
ARG CIRCUIT_NAME=wallet
ARG ZKEMAIL_COMMIT=e6592d86cb200d98d46db62d63404e7214a11569

RUN apt-get update && apt-get upgrade -y 

# Update the package list and install necessary dependencies
RUN apt-get update && \
    apt install -y nodejs npm cmake build-essential pkg-config libssl-dev libgmp-dev libsodium-dev nasm git awscli

RUN npm install -g yarn npx

# Clone zk email repository at the latest commit and set it as the working directory
RUN git clone https://github.com/zkemail/zk-email-verify -b ${ZKEMAIL_BRANCH_NAME} /zk-email-verify
RUN mkdir /zk-email-verify/build
RUN mkdir /zk-email-verify/build/${CIRCUIT_NAME}
WORKDIR /zk-email-verify/build/${CIRCUIT_NAME}
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_nonchunked.zkey -o ./${CIRCUIT_NAME}.zkey
RUN mkdir /zk-email-verify/build/${CIRCUIT_NAME}/${CIRCUIT_NAME}_js
RUN mkdir /zk-email-verify/build/${CIRCUIT_NAME}/${CIRCUIT_NAME}_cpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_js/generate_witness.js -o ./${CIRCUIT_NAME}_js/generate_witness.js
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm -o ./${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wat -o ./${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wat
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_js/witness_calculator.js -o ./${CIRCUIT_NAME}_js/witness_calculator.js
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/calcwit.cpp -o ./${CIRCUIT_NAME}_cpp/calcwit.cpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/calcwit.hpp -o ./${CIRCUIT_NAME}_cpp/calcwit.hpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/circom.hpp -o ./${CIRCUIT_NAME}_cpp/circom.hpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/fr.asm -o ./${CIRCUIT_NAME}_cpp/fr.asm
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/fr.cpp -o ./${CIRCUIT_NAME}_cpp/fr.cpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/fr.hpp -o ./${CIRCUIT_NAME}_cpp/fr.hpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/main.cpp -o ./${CIRCUIT_NAME}_cpp/main.cpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/Makefile -o ./${CIRCUIT_NAME}_cpp/Makefile
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/${CIRCUIT_NAME}.cpp -o ./${CIRCUIT_NAME}_cpp/${CIRCUIT_NAME}.cpp
RUN curl -L https://zkemail-zkey-chunks.s3.amazonaws.com/${ZKEMAIL_COMMIT}/${CIRCUIT_NAME}_cpp/${CIRCUIT_NAME}.dat -o ./${CIRCUIT_NAME}_cpp/${CIRCUIT_NAME}.dat
WORKDIR /zk-email-verify

RUN yarn install
RUN yarn add tsx psl