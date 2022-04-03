import {
  bytesToBigInt,
  stringToBytes,
  toCircomBigIntBytes,
} from "../binaryFormat";
import {
  MAGIC_DOUBLE_BLIND_BASE_MESSAGE,
  MAGIC_DOUBLE_BLIND_BASE_MESSAGE_LEN,
  CIRCOM_FIELD_MODULUS,
} from "../constants";
import { generateMerkleTreeInputs } from "../merkle";
import { initializePoseidon, poseidon, poseidonK } from "../poseidonHash";
import { verifyRSA } from "../rsa";
import { shaHash } from "../shaHash";
import { getRawSignature, sshSignatureToPubKey } from "../sshFormat";
import { IGroupMessage, IGroupSignature, IIdentityRevealer } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";
// @ts-ignore
import sshpk from "sshpk";
import localforage from "localforage";

interface ICircuitInputs {
  enableSignerId: string;
  signerNamespace: string;
  modulus: string[];
  signature: string[];
  base_message: string[];
  payload: string;
  pathElements: (string | number)[];
  pathIndices: (string | number)[];
  root: string;
}

export async function getCircuitInputs(
  sshSignature: string,
  groupMessage: IGroupMessage
): Promise<{
  valid: {
    validSignatureFormat?: boolean;
    validPublicKeyGroupMembership?: boolean;
    validMessage?: boolean;
  };
  circuitInputs?: ICircuitInputs;
  signerId?: string;
  identityRevealer?: IIdentityRevealer;
}> {
  const {
    signerNamespace,
    enableSignerId,
    message,
    groupName,
    groupPublicKeys,
  } = groupMessage;
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
  const baseMessageBigInt = MAGIC_DOUBLE_BLIND_BASE_MESSAGE;
  const validMessage =
    (messageBigInt &
      ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_LEN)) - 1n)) ===
    baseMessageBigInt;

  if (!validMessage || !validPublicKeyGroupMembership) {
    return {
      valid: {
        validSignatureFormat,
        validPublicKeyGroupMembership,
        validMessage,
      },
    };
  }
  const signerNamespaceBigint = enableSignerId
    ? bytesToBigInt(await shaHash(stringToBytes(signerNamespace))) %
      CIRCOM_FIELD_MODULUS
    : 0n;
  const palyoadBigint =
    bytesToBigInt(await shaHash(stringToBytes(message + " -- " + groupName))) %
    CIRCOM_FIELD_MODULUS;

  // modExp(bytesToBigInt(rawSignature), 65537, bytesToBigInt(data.modulusBytes))

  const { pathElements, pathIndices, root } = await generateMerkleTreeInputs(
    groupModulusBigInts,
    modulusBigInt
  );

  // Compute identity revealer
  /*
    component nullifierOpeningPoseidon = Poseidon(2);
    nullifierOpeningPoseidon.inputs[0] <== privPoseidonK.out;
    nullifierOpeningPoseidon.inputs[1] <== signerNamespace;
    signerIdOpening <== nullifierOpeningPoseidon.out;
    log(signerIdOpening);

    signal signerId;
    component signerIdPoseidon = Poseidon(2);
    signerIdPoseidon.inputs[0] <== leaf;
    signerIdPoseidon.inputs[1] <== signerIdOpening;
    signerId <== signerIdPoseidon.out * enableSignerId;
    log(signerId);*/
  let identityRevealer, signerId;
  if (enableSignerId) {
    identityRevealer = {
      pubKey: sshSignatureToPubKey(sshSignature),
      opener: poseidon([
        poseidonK(toCircomBigIntBytes(signatureBigInt)),
        signerNamespaceBigint.toString(),
      ]),
    };

    signerId = poseidon([
      poseidonK(toCircomBigIntBytes(modulusBigInt)),
      identityRevealer.opener,
    ]);
  } else {
    signerId = "0";
  }

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
      signerNamespace: signerNamespaceBigint.toString(),
      payload: palyoadBigint.toString(),
      pathElements,
      pathIndices,
      root,
    },
    identityRevealer: identityRevealer,
    signerId: signerId,
  };
}

export async function generateGroupSignature(
  circuitInputs: ICircuitInputs,
  groupMessage: IGroupMessage,
  signerId: string
): Promise<IGroupSignature> {
  const wasmFile = "rsa_group_sig_verify.wasm";
  const zkeyBuff: ArrayBuffer | null = await localforage.getItem(
    "rsa_group_sig_verify_0000.zkey"
  );
  if (!zkeyBuff) {
    throw new Error("Must complete setup to generate signatures.");
  }

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmFile,
    new Uint8Array(zkeyBuff) // See https://github.dev/iden3/fastfile/blob/d02262bce0b74357e86aac143a0b6330a8ab0897/src/fastfile.js#L51-L52 for formats
  );
  console.log(publicSignals);
  return {
    zkProof: proof,
    signerId: signerId,
    groupMessage,
  };
}
