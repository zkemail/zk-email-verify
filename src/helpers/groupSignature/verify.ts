import { bytesToBigInt, stringToBytes, toCircomBigIntBytes } from "../binaryFormat";
import { MAGIC_DOUBLE_BLIND_BASE_MESSAGE, CIRCOM_FIELD_MODULUS } from "../constants";
import { initializePoseidon, poseidon, poseidonK } from "../poseidonHash";
import { shaHash } from "../shaHash";
import { IGroupSignature, IIdentityRevealer } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";
// @ts-ignore
import sshpk from "sshpk";
import { resolveGroupIdentifierRoot } from "./resolveGroupIdentifier";
import { ICircuitInputs } from "../../scripts/generate_input";

// export async function getPublicCircuitSignals(groupSignature: IGroupSignature): Promise<string[]> {
//   await initializePoseidon();

//   const {
//     signerId,
//     groupMessage: { signerNamespace, enableSignerId, message, groupName, groupIdentifier: groupPublicKeys },
//   } = groupSignature;

//   const baseMessageBigInt = MAGIC_DOUBLE_BLIND_BASE_MESSAGE;

//   const signerNamespaceBigint = enableSignerId ? bytesToBigInt(stringToBytes(await (await shaHash(stringToBytes(signerNamespace))).toString())) % CIRCOM_FIELD_MODULUS : 0n;
//   const palyoadBigint = bytesToBigInt(await shaHash(stringToBytes(message + " -- " + groupName))) % CIRCOM_FIELD_MODULUS;

//   const root = await resolveGroupIdentifierRoot(groupPublicKeys);

//   return [poseidon([poseidonK(toCircomBigIntBytes(baseMessageBigInt)), signerId, signerNamespaceBigint.toString(), palyoadBigint.toString(), root, enableSignerId ? "1" : "0"])];
// }

export async function getPublicCircuitSignals(inputData: ICircuitInputs): Promise<string[]> {
  return inputData.in_body_padded || [""];
}

export async function verifyGroupSignature(inputData: ICircuitInputs, zkProof: any): Promise<boolean> {
  console.log("verifying");
  // reconstruct public signals from group signature metadata
  const signals = await getPublicCircuitSignals(inputData);
  console.log(signals);

  const vKeyJson = await (await fetch("rsa_group_sig_verify_0000.vkey.json")).json();
  try {
    const res = await snarkjs.groth16.verify(vKeyJson, signals, zkProof);
    console.log(res);
    return res;
  } catch (e) {
    debugger;
    return false;
  }
}

// export async function verifyIdentityRevealer(identityRevealer: IIdentityRevealer, signerId: string): Promise<boolean> {
//   const modulusBigInt = bytesToBigInt(sshpk.parseKey(identityRevealer.pubKey, "ssh").parts[1].data);
//   return signerId === poseidon([poseidonK(toCircomBigIntBytes(modulusBigInt)), identityRevealer.opener]);
// }
