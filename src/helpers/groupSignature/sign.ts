import { bytesToBigInt, stringToBytes, toCircomBigIntBytes } from "../binaryFormat";
import { MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX, MAGIC_DOUBLE_BLIND_REGEX, CIRCOM_FIELD_MODULUS } from "../constants";
import { generateMerkleTreeInputs } from "../merkle";
import { initializePoseidon } from "../poseidonHash";
import { verifyRSA } from "../rsa";
import { shaHash } from "../shaHash";
import { getRawSignature } from "../sshFormat";
import { IGroupSignature } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";

interface ICircuitInputs {
  useNullifier: string;
  modulus: string[];
  signature: string[];
  base_message: string[];
  payload1: string;
  payload2: string;
  pathElements: (string|number)[];
  pathIndices: (string|number)[];
  root: string;
}

export async function getCircuitInputs(signature: string, payload1: string, payload2: string, groupKeys: any[]): Promise<{
  circuitInputs: ICircuitInputs;
  valid: {
    validPublicKeyGroupMembership: boolean;
    validMessage: boolean;
  }
}> {
  await initializePoseidon();
  const { rawSignature, pubKeyParts } = getRawSignature(signature);
  const groupModulusBigInts = groupKeys.map((key) =>
    bytesToBigInt(key.parts[1].data)
  );
  const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const validPublicKeyGroupMembership = groupModulusBigInts.includes(
    modulusBigInt
  );
  const signatureBigInt = bytesToBigInt(rawSignature);
  const messageBigInt = verifyRSA(signatureBigInt, modulusBigInt);
  const baseMessageBigInt =
    messageBigInt &
    ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX.length * 4)) - 1n);
  const validMessage = !!MAGIC_DOUBLE_BLIND_REGEX.exec(
    messageBigInt.toString(16)
  );

  const payload1HashBigInt =
    bytesToBigInt(await shaHash(stringToBytes(payload1))) %
    CIRCOM_FIELD_MODULUS;
  const payload2HashBigInt =
    bytesToBigInt(await shaHash(stringToBytes(payload2))) %
    CIRCOM_FIELD_MODULUS;

  // modExp(bytesToBigInt(rawSignature), 65537, bytesToBigInt(data.modulusBytes))

  const { pathElements, pathIndices, root } = await generateMerkleTreeInputs(
    groupModulusBigInts,
    modulusBigInt
  );
  return {
    // parts: rsaKey.parts,
    valid: {
      validPublicKeyGroupMembership,
      validMessage,
    },
    circuitInputs: {
      useNullifier: "1",
      modulus: toCircomBigIntBytes(modulusBigInt),
      signature: toCircomBigIntBytes(signatureBigInt),
      base_message: toCircomBigIntBytes(baseMessageBigInt),
      payload1: payload1HashBigInt.toString(),
      payload2: payload2HashBigInt.toString(),
      pathElements,
      pathIndices,
      root,
    },
  };
}

export async function generateGroupSignature(circuitInputs: ICircuitInputs, groupKeys: string[]): Promise<IGroupSignature> {
  const wasmFile = "main.wasm";
  const zkeyFile = "circuit_0000.zkey";
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmFile,
    zkeyFile
  );
  console.log(publicSignals);
  return {
    proof,
    payload1: circuitInputs.payload1,
    payload2: circuitInputs.payload2,
    nullifier: publicSignals.nullifier,
    groupKeys,
  };
}
