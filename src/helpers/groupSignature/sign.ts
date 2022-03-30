import {
  bytesToBigInt,
  stringToBytes,
  toCircomBigIntBytes,
} from "../binaryFormat";
import {
  MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX,
  MAGIC_DOUBLE_BLIND_REGEX,
  CIRCOM_FIELD_MODULUS,
} from "../constants";
import { generateMerkleTreeInputs } from "../merkle";
import { initializePoseidon } from "../poseidonHash";
import { verifyRSA } from "../rsa";
import { shaHash } from "../shaHash";
import { getRawSignature } from "../sshFormat";
import { IGroupMessage, IGroupSignature } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";
// @ts-ignore
import sshpk from "sshpk";

interface ICircuitInputs {
  enableSignerId: string;
  modulus: string[];
  signature: string[];
  base_message: string[];
  topic: string;
  payload: string;
  pathElements: (string | number)[];
  pathIndices: (string | number)[];
  root: string;
}

export async function getCircuitInputs(
  sshSignature: string,
  groupMessage: IGroupMessage
): Promise<{
  circuitInputs?: ICircuitInputs;
  valid: {
    validSignatureFormat?: boolean;
    validPublicKeyGroupMembership?: boolean;
    validMessage?: boolean;
  };
}> {
  const { topic, enableSignerId, message, groupName, groupPublicKeys } =
    groupMessage;
  await initializePoseidon();
  let validSignatureFormat = true;
  let rawSignature: any, pubKeyParts: any;
  try {
    const rawSig = getRawSignature(sshSignature);
    rawSignature = rawSig.rawSignature;
    pubKeyParts = rawSig.pubKeyParts;
  } catch (e) {
    console.error(e);
    return {
      valid: {
        validSignatureFormat: false,
      },
    };
  }
  const groupModulusBigInts = groupPublicKeys.map((key) =>
    bytesToBigInt(sshpk.parseKey(key, "ssh").parts[1].data)
  );
  const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
  const validPublicKeyGroupMembership =
    groupModulusBigInts.includes(modulusBigInt);
  const signatureBigInt = bytesToBigInt(rawSignature);
  const messageBigInt = verifyRSA(signatureBigInt, modulusBigInt);
  const baseMessageBigInt =
    messageBigInt &
    ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX.length * 4)) - 1n);
  const validMessage = !!MAGIC_DOUBLE_BLIND_REGEX.exec(
    messageBigInt.toString(16)
  );

  if (!validMessage || !validPublicKeyGroupMembership) {
    return {
      valid: {
        validSignatureFormat,
        validPublicKeyGroupMembership,
        validMessage,
      },
    };
  }
  const topicBigint =
    bytesToBigInt(await shaHash(stringToBytes(topic))) % CIRCOM_FIELD_MODULUS;
  const palyoadBigint =
    bytesToBigInt(await shaHash(stringToBytes(message + " -- " + groupName))) %
    CIRCOM_FIELD_MODULUS;

  // modExp(bytesToBigInt(rawSignature), 65537, bytesToBigInt(data.modulusBytes))

  const { pathElements, pathIndices, root } = await generateMerkleTreeInputs(
    groupModulusBigInts,
    modulusBigInt
  );
  return {
    // parts: rsaKey.parts,
    valid: {
      validSignatureFormat,
      validPublicKeyGroupMembership,
      validMessage,
    },
    circuitInputs: {
      enableSignerId: enableSignerId ? "1" : "0",
      modulus: toCircomBigIntBytes(modulusBigInt),
      signature: toCircomBigIntBytes(signatureBigInt),
      base_message: toCircomBigIntBytes(baseMessageBigInt),
      topic: topicBigint.toString(),
      payload: palyoadBigint.toString(),
      pathElements,
      pathIndices,
      root,
    },
  };
}

export async function generateGroupSignature(
  circuitInputs: ICircuitInputs,
  groupMessage: IGroupMessage
): Promise<IGroupSignature> {
  const wasmFile = "main.wasm";
  const zkeyFile = "circuit_0000.zkey";
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmFile,
    zkeyFile
  );
  console.log(publicSignals);
  return {
    zkProof: proof,
    groupMessage,
  };
}
