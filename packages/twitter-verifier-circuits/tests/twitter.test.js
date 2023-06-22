const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;

exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("Twitter email test", function () {
  this.timeout(10000000);

  it("should fail proof generation for invalid input", async function () {
    const circuit = await wasm_tester(
      path.join(__dirname, "../twitter.circom"),
      {
        recompile: false,
        output: path.join(__dirname, "../build/twitter"),
      }
    );

    const input = {
      in_padded: new Array(1024).fill(0),
      modulus: new Array(17).fill(0),
      signature: new Array(17).fill(0),
      in_len_padded_bytes: 1,
      address: '0x00000000000000',
      body_hash_idx: 0,
      precomputed_sha: new Array(32).fill(0),
      in_body_padded: new Array(1536).fill(0),
      in_body_len_padded_bytes: 1,
      twitter_username_idx: 5,
    };
    
    try {
      await circuit.calculateWitness(input);
      assert(false);
    } catch (error) {
      assert(true);      
    }
  });
});
