/* global BigInt */

// @ts-ignore
import React from "react";
// @ts-ignore
import * as snarkjs from "snarkjs";
import { useState } from "react";
import { useAsync } from "react-use";
// @ts-ignore
import sshpk from "sshpk";
// @ts-ignore
import _ from "lodash";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";
import { bytesToBigInt, stringToBytes } from "../helpers/binaryFormat";
import { getRawSignature } from "../helpers/sshFormat";
import { H } from "../helpers/hash";
import { modExp } from "../helpers/rsa";

const DEFAULT_PUBLIC_KEY_1 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_PUBLIC_KEY_2 =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDiIy+zqA142+M+GJvVV6Q+YCzic8ZjEzGduW/qtl+vMIx1fUU0GgWoyO3P6FnOr5AGkW4z8NG+CZaDdotwaes3IErJosDzMtAPbF1AfDYs4jIg3HCEC3ZGi2a6X5/TxiSVMAk79k4A6s8td/wP6dGInPVDdqKfhVsACn7NboJHUsqRurImHNVKpuqU9SvO+u10LFm/cSP7bkUkhLjAmlP3TN6MmupvU7JgIRqM1GMYr7yismap0w4fHfISE2jxQ9xcfV1QL2uHF7Wy3jr5uPXYn5LoNQjKw+PpL2ZaQGVVre3V4gBztr8loKo/Gkkg4JTsDk5yiACBMRHGLy4dS0wl stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_SIGNATURE = `-----BEGIN SSH SIGNATURE-----
U1NIU0lHAAAAAQAAARcAAAAHc3NoLXJzYQAAAAMBAAEAAAEBAMVgWqy6Lo+ksM3QDZuXIE
n9lWdMRiOeWe5GH382zYNcyjhhHISrTvwfrxD0x2DDYWBw0cV7/kd2t9PxO6lGzYhIZyka
c26m8BGP1oP3Uk0B3N7Thmys/UgKhbYms6NexTr55kslV5dmExQI4XQII0CtmWN2Tujwas
BQjxwTPLEw+1FmwrL9nr/qvhQGAH7z+gWU4mfYKW03ey/OkPFHxlVYYMCRkoJ2oqrcMpqG
6Zu/f02JKYS8VY89X17uax6ScDy8b0DNDbiyIw9nw7aRfbCXQCfAHQhweCsV9lP9cWeGJe
JWkn1x6HwCo8EBfJFfe7rQdKwTo0TuiIH3OIDysB8AAAAPZG91YmxlYmxpbmQueHl6AAAA
AAAAAAZzaGE1MTIAAAEUAAAADHJzYS1zaGEyLTUxMgAAAQAaogS/+Wp9JcG1HMOaLkVN8k
j9ijWGDnfaCykVwMT2hYXjEubcnD1/3pgAhmlYQQTdMdZTS9+7sHibB7mhWTXvQu+zvOH1
Egsc8qUSMzRcnaziZD5g5Op1j7lRRHwyYtbZHsPGTPxynopnZtYlHt4JTXDHotKYAwhFiz
0HFc7oPrHr495bwSEOiWW76HWGRu4DoWTbRJ97HEzKq08QrzM3BumCA3az65szN6v21Y4M
QjSs+w677P/43CeXxFIYoK5N/vhXeI+6FAg2oGA3rn1sFfauoOnmbQqQ85KQ2DyQsks487
jBIoOQ90WPWCEhZDTNmVkrpBft05kmbgkm/FeS
-----END SSH SIGNATURE-----`;

// the numeric form of the payload1 passed into the primitive
// corresponds to the openssh signature produced by the following command:
// echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n do_not_share_this_signature@doubleblind.xyz -f ~/.ssh/id_rsa  | pbcopy
// regex
const MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX =
  "003051300d0609608648016503040203050004403710c692cc2c46207b0c6f9369e709afe9fcdbe1f7097370c1fc7a55aeef8dd0aa9d0a084526dbe59eb24eee4a5320c1f053def2e404c5b45ade44f9b56143e9";
const MAGIC_DOUBLE_BLIND_REGEX = new RegExp(
  `^1(ff)+${MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX}$`
);

const CIRCOM_FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// circom constants from circuit https://zkrepl.dev/?gist=30d21c7a7285b1b14f608325f172417b
// template RSAGroupSigVerify(n, k, levels) {
// component main { public [ modulus ] } = RSAVerify(121, 17);
// component main { public [ root, payload1 ] } = RSAGroupSigVerify(121, 17, 30);
const CIRCOM_BIGINT_N = 121;
const CIRCOM_BIGINT_K = 17;
const CIRCOM_LEVELS = 30;
function toCircomBigIntBytes(num: bigint) {
  const res = [];
  const msk = (1n << BigInt(CIRCOM_BIGINT_N)) - 1n;
  for (let i = 0; i < CIRCOM_BIGINT_K; ++i) {
    res.push(((num >> BigInt(i * CIRCOM_BIGINT_N)) & msk).toString());
  }
  return res;
}

let poseidonHasher: any;
async function initializePoseidon() {
  if (!poseidonHasher) {
    poseidonHasher = await buildPoseidon();
  }
}
const poseidon = (arr: (number | bigint | string)[]) =>
  poseidonHasher.F.toString(poseidonHasher(arr));
const poseidonK = (ar: (number | bigint | string)[]) => {
  let cur: (number | bigint | string)[] = [];
  for (const elt of ar) {
    cur.push(elt);
    if (cur.length === 16) {
      cur = [poseidon(cur)];
    }
  }
  if (cur.length === 1) return cur[0];
  while (cur.length < 16) cur.push(0);
  return poseidon(cur);
};

async function buildMerkleTree(groupModulusBigInts: bigint[]) {
  groupModulusBigInts = _.sortBy(groupModulusBigInts);
  let SIZE = groupModulusBigInts.length;
  const res = _.times(2 * SIZE, () => "0");
  for (let i = 0; i < SIZE; ++i) {
    const bigIntBytes = toCircomBigIntBytes(groupModulusBigInts[i]);
    res[SIZE + i] = poseidonK(bigIntBytes);
  }
  for (let i = SIZE - 1; i > 0; --i) {
    res[i] = poseidon([res[2 * i], res[2 * i + 1]]);
  }
  return res;
}

async function generateMerkleTreeInputs(
  groupModulusBigInts: bigint[],
  modulusBigInt: bigint
) {
  const tree = await buildMerkleTree(groupModulusBigInts);
  const leaf = poseidonK(toCircomBigIntBytes(modulusBigInt));
  const pathElements = [];
  const pathIndices = [];
  for (let idx = tree.indexOf(leaf); idx > 1; idx = idx >> 1) {
    pathElements.push(tree[idx ^ 1]);
    pathIndices.push(idx & 1);
  }
  while (pathElements.length < CIRCOM_LEVELS) {
    pathElements.push(0);
    pathIndices.push(0);
  }
  const root = tree[1];
  return {
    leaf,
    pathElements,
    pathIndices,
    root,
  };
}

export const Prover: React.FC<{}> = (props) => {
  const [groupKeys, setGroupKeys] = useState([
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_1, "ssh"),
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_2, "ssh"),
  ]);
  const [payload1, setPayload1] = useState("Hello World");
  const [groupSignature, setGroupSignature] = useState<any>();
  const [payload2, setPayload2] = useState("");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const {
    value: { circuitInput, valid } = {
      circuitInput: undefined,
      valid: undefined,
    },
    error,
  } = useAsync(async (): Promise<{
    circuitInput?: any;
    valid?: any;
    error?: any;
  }> => {
    await initializePoseidon();

    if (!groupKeys) return { error: "Invalid group keys" };
    const { rawSignature, pubKeyParts } = getRawSignature(signature);
    const groupModulusBigInts = groupKeys.map((key) =>
      bytesToBigInt(key.parts[1].data)
    );
    const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
    const validPublicKeyGroupMembership = _.includes(
      groupModulusBigInts,
      modulusBigInt
    );
    const signatureBigInt = bytesToBigInt(rawSignature);
    const messageBigInt = modExp(signatureBigInt, 65537, modulusBigInt);
    const baseMessageBigInt =
      messageBigInt &
      ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX.length * 4)) - 1n);
    const validMessage = !!MAGIC_DOUBLE_BLIND_REGEX.exec(
      messageBigInt.toString(16)
    );

    const payload1HashBigInt =
      bytesToBigInt(await H(stringToBytes(payload1))) % CIRCOM_FIELD_MODULUS;
    const payload2HashBigInt =
      bytesToBigInt(await H(stringToBytes(payload2))) % CIRCOM_FIELD_MODULUS;

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
      circuitInput: {
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
  }, [signature, payload1, payload2, groupKeys]);
  if (error) console.error(error);
  return (
    <div className="App">
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
      <div>
        <h3>Instructions</h3>
        1. Run the following command (see{" "}
        <a href="https://man7.org/linux/man-pages/man1/ssh-keygen.1.html">
          Man Page
        </a>{" "}
        of <code>ssh-keygen</code> for more info).
        <br />
        <pre>
          echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n
          doubleblind.xyz -f ~/.ssh/id_rsa
        </pre>
        2. Enter the signature in this page but do not share it with anyone
        else.
        <br />
      </div>
      <div className="fields">
        <div>
          <label>SSH Signature</label>
          <textarea
            style={{ height: 100 }}
            value={signature}
            onChange={(e) => {
              setSignature(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Payload 1</label>
          <input
            value={payload1}
            onChange={(e) => {
              setPayload1(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Payload 2</label>
          <input
            value={payload2}
            onChange={(e) => {
              setPayload2(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Group Public Keys</label>
          <textarea
            ref={(c) => {
              if (c)
                c.innerHTML =
                  DEFAULT_PUBLIC_KEY_1 + "\n" + DEFAULT_PUBLIC_KEY_2;
            }}
            style={{ height: 100, width: 400 }}
            onChange={(e) => {
              const lines = _.compact(e.currentTarget.value.split("\n"));
              try {
                const keys = lines.map((line: string) =>
                  sshpk.parseKey(line, "ssh")
                );
                setGroupKeys(keys);
              } catch (err) {
                setGroupKeys([]);
              }
            }}
          />
        </div>
      </div>
      <br />
      <h3>ZK Proof</h3>
      {valid && !valid.validPublicKeyGroupMembership && (
        <div>
          Warning: Provided SSH Signature does not correspond with any public
          key in the group.
        </div>
      )}
      {valid && !valid.validMessage && (
        <div>
          Warning: Provided SSH Signature does not correspond with the correct
          payload.
        </div>
      )}
      <textarea
        readOnly
        style={{ height: 200, width: "100%" }}
        value={
          groupSignature
            ? JSON.stringify(groupSignature)
            : "Click generate proof"
        }
      />

      <br />
      <button
        onClick={async () => {
          if (groupSignature === "Computing ZK Proof...") {
            return;
          }
          const wasmFile = "main.wasm";
          const zkeyFile = "circuit_0000.zkey";
          const verificationKey = "verification_key.json";
          setGroupSignature("Computing ZK Proof...");
          try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
              circuitInput,
              wasmFile,
              zkeyFile
            );
            setGroupSignature({
              proof,
              payload1,
              payload2,
              publicSignals,
              groupKeys,
            });
          } catch (e) {
            setGroupSignature("Error Computing ZK Proof...");
            console.error(e);
          }
        }}
      >
        Generate proof
      </button>
    </div>
  );
};
