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
import { IGroupSignature } from "./types";
// @ts-ignore
import * as snarkjs from "snarkjs";

export async function verifyGroupSignature(groupSignature: IGroupSignature) {
  console.log("verifying");
  // reconstruct public signals from group signature metadata
  const signals: any[] = [
    "13034038797458192704974609185426348888474874684599939316774554231816360076372",
  ];

  const vKeyJson = await (await fetch("verification_key.json")).json();
  try {
    const res = await snarkjs.groth16.verify(
      vKeyJson,
      signals,
      groupSignature.zkProof
    );
    console.log(res);
  } catch (e) {
    debugger;
  }
}
