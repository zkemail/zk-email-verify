import {
  bytesToBigInt,
  stringToBytes,
  toCircomBigIntBytes,
} from "../binaryFormat";
import {
  MAGIC_DOUBLE_BLIND_BASE_MESSAGE,
  CIRCOM_FIELD_MODULUS,
} from "../constants";
import { buildMerkleTree } from "../merkle";
import { initializePoseidon, poseidon, poseidonK } from "../poseidonHash";
import { shaHash } from "../shaHash";
import { getRawSignature } from "../sshFormat";
import { IGroupSignature, IIdentityRevealer } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";
// @ts-ignore
import sshpk from "sshpk";

export async function getPublicCircuitSignals(
  groupSignature: IGroupSignature,
): Promise<string[]> {
  await initializePoseidon();

  const {
    signerId,
    groupMessage: { topic, enableSignerId, message, groupName, groupPublicKeys },
  } =
    groupSignature;

  const baseMessageBigInt = MAGIC_DOUBLE_BLIND_BASE_MESSAGE;

  const topicBigint =
    bytesToBigInt(await shaHash(stringToBytes(topic))) % CIRCOM_FIELD_MODULUS;
  const palyoadBigint =
    bytesToBigInt(await shaHash(stringToBytes(message + " -- " + groupName))) %
    CIRCOM_FIELD_MODULUS;

  const groupModulusBigInts = groupPublicKeys.map((key) =>
    bytesToBigInt(sshpk.parseKey(key, "ssh").parts[1].data)
  );
  const root = (await buildMerkleTree(groupModulusBigInts))[1];

  return [poseidon([
    poseidonK(toCircomBigIntBytes(baseMessageBigInt)),
    signerId,
    topicBigint.toString(),
    palyoadBigint.toString(),
    root,
    enableSignerId ? "1" : "0",
  ])];
}

export async function verifyGroupSignature(groupSignature: IGroupSignature): Promise<boolean> {
  console.log("verifying");
  // reconstruct public signals from group signature metadata
  const signals = await getPublicCircuitSignals(groupSignature);
  console.log(signals);

  const vKeyJson = await (await fetch("verification_key.json")).json();
  try {
    const res = await snarkjs.groth16.verify(
      vKeyJson,
      signals,
      groupSignature.zkProof
    );
    console.log(res);
    return res;
  } catch (e) {
    debugger;
    return false;
  }
}

export async function verifyIdentityRevealer(identityRevealer: IIdentityRevealer, signerId: string): Promise<boolean> {
  const modulusBigInt = bytesToBigInt(sshpk.parseKey(identityRevealer.pubKey, "ssh").parts[1].data);
  return signerId === poseidon([poseidonK(toCircomBigIntBytes(modulusBigInt)), identityRevealer.opener]);
}
