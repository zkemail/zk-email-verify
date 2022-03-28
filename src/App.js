/* global BigInt */

import "./styles.css";
import { useState } from "react";
import { useAsync } from "react-use";
import sshpk from "sshpk";
import _, { result } from "lodash";
import { buildPoseidon } from "circomlibjs";

import Merkle from "./Merkle";

const DEFAULT_PUBLIC_KEY_1 ="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFYFqsui6PpLDN0A2blyBJ/ZVnTEYjnlnuRh9/Ns2DXMo4YRyEq078H68Q9Mdgw2FgcNHFe/5HdrfT8TupRs2ISGcpGnNupvARj9aD91JNAdze04ZsrP1ICoW2JrOjXsU6+eZLJVeXZhMUCOF0CCNArZljdk7o8GrAUI8cEzyxMPtRZsKy/Z6/6r4UBgB+8/oFlOJn2CltN3svzpDxR8ZVWGDAkZKCdqKq3DKahumbv39NiSmEvFWPPV9e7mseknA8vG9AzQ24siMPZ8O2kX2wl0AnwB0IcHgrFfZT/XFnhiXiVpJ9ceh8AqPBAXyRX3u60HSsE6NE7oiB9ziA8rAf stevenhao@Stevens-MacBook-Pro.local";
const DEFAULT_PUBLIC_KEY_2 = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDiIy+zqA142+M+GJvVV6Q+YCzic8ZjEzGduW/qtl+vMIx1fUU0GgWoyO3P6FnOr5AGkW4z8NG+CZaDdotwaes3IErJosDzMtAPbF1AfDYs4jIg3HCEC3ZGi2a6X5/TxiSVMAk79k4A6s8td/wP6dGInPVDdqKfhVsACn7NboJHUsqRurImHNVKpuqU9SvO+u10LFm/cSP7bkUkhLjAmlP3TN6MmupvU7JgIRqM1GMYr7yismap0w4fHfISE2jxQ9xcfV1QL2uHF7Wy3jr5uPXYn5LoNQjKw+PpL2ZaQGVVre3V4gBztr8loKo/Gkkg4JTsDk5yiACBMRHGLy4dS0wl stevenhao@Stevens-MacBook-Pro.local";
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
const SSH_MAGIC_PREAMBLE = "SSHSIG";
const SSH_RESERVED = "";

// the numeric form of the message passed into the primitive 
// corresponds to the openssh signature produced by the following command:
// echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n do_not_share_this_signature@doubleblind.xyz -f ~/.ssh/id_rsa  | pbcopy
// regex 
const MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX = "003051300d0609608648016503040203050004403710c692cc2c46207b0c6f9369e709afe9fcdbe1f7097370c1fc7a55aeef8dd0aa9d0a084526dbe59eb24eee4a5320c1f053def2e404c5b45ade44f9b56143e9";
const MAGIC_DOUBLE_BLIND_REGEX = new RegExp(`^1(ff)+${MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX}$`);

function equalArrays(ar1, ar2) {
  if (ar1.length !== ar2.length) return false;
  for (let i = 0; i < ar1.length; ++i) if (ar1[i] !== ar2[i]) return false;
  return true;
}
function bytesToString(bytes) {
  if (bytes.__proto__ !== ArrayBuffer.prototype) {
    if(!bytes.buffer) {
      // debugger;
    }
    bytes = bytes.buffer;
  }
  if (!bytes || bytes.__proto__ !== ArrayBuffer.prototype) {
    // debugger;
  }
  return new TextDecoder("utf-8").decode(bytes);
}
function bytesToInt(bytes) {
  return bytes[3] +
  256 * (bytes[2] + 256 * (bytes[1] + 256 * bytes[0]));
}
function intToBytes(int) {
  return [Math.floor(int / 256 / 256 / 256) % 256, Math.floor(int / 256 / 256) % 256, Math.floor(int / 256) % 256, int % 256];
}
function stringToBytes(str) {
  return Uint8Array.from(str, (x) => x.charCodeAt(0))
}

function concatBytes(ar1, ar2) {
  const res = new Uint8Array(ar1.length + ar2.length);
  res.set(ar1);
  res.set(ar2, ar1.length);
  return res;
}

function packSshStrings(strings) {
  const result = [];
  for (const s of strings) {
    intToBytes(s.length).forEach((b) => result.push(b));
    s.forEach((b) => result.push(b));
  }
  return new Uint8Array(result);
}

function unpackSshBytes(bytes, numStrings) {
  const result = [];
  let offset = 0;
  for (let i = 0; i < numStrings; ++i) {
    const lenBytes = bytes.slice(offset, offset + 4);
    // first 4 bytes is length in big endian
    const len = bytesToInt(lenBytes);
    console.log("len is", len);
    const str = bytes.slice(offset + 4, offset + 4 + len);
    result.push(str);
    offset += 4 + len;
  }
  if (offset !== bytes.length) {
    throw new Error('Error unpacking; offset is not at end of bytes');
  }
  return result;
}

async function H(str) {
  console.log("running H");
  const res = new Uint8Array(await crypto.subtle.digest(
    "SHA-512",
    str,
  ));
  return res;
}


function getRawSignature(signature) {
  // 0. strip out "armor" headers (lines that start with -----)
  // 1. base64 -d
  // 2. skipping first 10 bytes (for MAGIC_PREAMBLE and SIG_VERSION), unpack into 5 strings: publickey, namespace, reserved, hash_algorithm, signature
  // 3. convert public key and signature to bignum

// #define MAGIC_PREAMBLE "SSHSIG"
// byte[6]   MAGIC_PREAMBLE
// string    namespace
// string    reserved
// string    hash_algorithm
// string    H(message)

  const encodedPart = signature
    .split("\n")
    .filter((line) => !line.includes("SSH SIGNATURE"))
    .join("");
  const bytes = stringToBytes(atob(encodedPart));
  console.log("0. encodedPart", encodedPart);
  console.log("1. base64 -d result:", bytes);
  const strings = unpackSshBytes(bytes.slice(10), 5);
  console.log("2. unpacked strings:", strings);
  const [
    pubKeyEncoded,
    namespace,
    reserved,
    hash_algorithm,
    rawSignatureEncoded
  ] = strings;
  console.log(strings.map(bytesToString));
  

  // decrypt pub key https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshsig.c#L203-L204
  // https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/sshkey.c#L828-L829
  const pubKeyParts = unpackSshBytes(
    pubKeyEncoded,
    3
  );
  // decrypt signature https://github.dev/openssh/openssh-portable/blob/4bbe815ba974b4fd89cc3fc3e3ef1be847a0befe/ssh-rsa.c#L223-L224
  const rawSigParts = unpackSshBytes(rawSignatureEncoded, 2);
  const rawSignAlgorithm = rawSigParts[0];
  const rawSignature = rawSigParts[1];
  console.log('raw sigparts is', rawSigParts.map(bytesToString));

  console.log("3. bignum bytes", pubKeyParts);
  console.log("4. sig is", rawSignature);
  return [rawSignature, namespace, hash_algorithm, pubKeyEncoded, pubKeyParts];
}

function modExp(a, b, c) {
  let res = 1n;
  for (let i = 0; i < 30; ++i) {
    if ((b >> i) & 1) res = (res * a) % c;
    a = a * a % c;
  }
  return res;
}

function bytesToBigInt(bytes) {
  let res = 0n;
  for (let i = 0; i < bytes.length; ++i) {
    res = (res << 8n) + BigInt(bytes[i]);
  }
  return res;
}


// circom constants from circuit https://zkrepl.dev/?gist=30d21c7a7285b1b14f608325f172417b
// template RSAGroupSigVerify(n, k, levels) {
// component main { public [ modulus ] } = RSAVerify(121, 17);
// component main { public [ root, message ] } = RSAGroupSigVerify(121, 17, 30);
const CIRCOM_BIGINT_N = 121;
const CIRCOM_BIGINT_K = 17;
const CIRCOM_LEVELS = 30;
function toCircomBigIntBytes(num) {
  const res = [];
  const msk = (1n << BigInt(CIRCOM_BIGINT_N)) - 1n;
  for (let i = 0; i < CIRCOM_BIGINT_K; ++i) {
    res.push(((num >> BigInt(i * CIRCOM_BIGINT_N)) & msk).toString());
  }
  return res;
}

let poseidonHasher;
async function initializePoseidon() {
  if (!poseidonHasher) {
    poseidonHasher = await buildPoseidon();
  }
}
const poseidon = arr => poseidonHasher.F.toString(poseidonHasher(arr));
const poseidonK = (ar) => {
  let cur = [];
  for (const elt of ar) {
    cur.push(elt);
    if (cur.length === 16) {
      cur = [poseidon(cur)];
    }
  }
  if (cur.length === 1) return cur[0];
  while (cur.length < 16) cur.push(0);
  return poseidon(cur);
}

async function buildMerkleTree(groupModulusBigInts) {
  groupModulusBigInts = _.sortBy(groupModulusBigInts);
  let SIZE = 1;
  while (SIZE < groupModulusBigInts.length) { SIZE *= 2; }
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

async function generateMerkleTreeInputs(groupModulusBigInts, modulusBigInt) {
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
    leaf, pathElements, pathIndices, root,
  }
}

export default function App() {
  const [groupKeys, setGroupKeys] = useState([
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_1, "ssh"),
    sshpk.parseKey(DEFAULT_PUBLIC_KEY_2, "ssh")
  ]);
  const [message, setMessage] = useState("Hello World");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const { value: circuitInput, error } = useAsync(async () => {
    await initializePoseidon();

    if (!groupKeys) return { error: "Invalid group keys" };
    const [
      rawSignature,
      namespace,
      hash_algorithm,
      pubKeyEncoded,
      pubKeyParts
    ] = getRawSignature(signature);
    console.log("raw sig is", bytesToString(rawSignature));
    console.log("raw sig bytes is", rawSignature);
    console.log('valid is...' );
    console.log(namespace)
    const validNamespace = hash_algorithm === 'sha512';
    const groupModulusBigInts = groupKeys.map(key => bytesToBigInt(key.parts[1].data));
    const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
    const validPublicKeyGroupMembership = _.includes(groupModulusBigInts, modulusBigInt);
    const signatureBigInt = bytesToBigInt(rawSignature);
    console.log(signatureBigInt);
    const messageBigInt = modExp(signatureBigInt, 65537, modulusBigInt);
    console.log('validPublicKeyGroupMembership is', validPublicKeyGroupMembership);
    console.log('message bigint is', messageBigInt);
    const baseMessageBigInt = messageBigInt & ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX.length * 4)) - 1n);
    console.log('base message bigint is', baseMessageBigInt);
    debugger;
    const validMessage = !!MAGIC_DOUBLE_BLIND_REGEX.exec(messageBigInt.toString(16));
    debugger;
    console.log('validMessage is', validMessage);
    
    // modExp(bytesToBigInt(rawSignature), 65537, bytesToBigInt(data.modulusBytes))

    const {
      leaf,
      pathElements,
      pathIndices,
      root,
    } = await generateMerkleTreeInputs(groupModulusBigInts, modulusBigInt);
    return {
      // parts: rsaKey.parts,
      validPublicKeyGroupMembership,
      validMessage,
      signature: toCircomBigIntBytes(signatureBigInt),
      modulus: toCircomBigIntBytes(modulusBigInt),
      padded_message: toCircomBigIntBytes(messageBigInt),
      base_message: toCircomBigIntBytes(baseMessageBigInt),
      payload: await H(stringToBytes(message)),
      leaf,
      pathElements,
      pathIndices,
      root,
    };
  }, [signature, message, groupKeys]);
  if (error) console.error(error);
  return (
    <div className="App">
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
      <div>
        <h3>Instructions</h3>
        1. Run the following command (see <a href="https://man7.org/linux/man-pages/man1/ssh-keygen.1.html">Man Page</a> of <code>ssh-keygen</code> for more info).
        <br/>
        <pre>
        echo "E PLURIBUS UNUM; DO NOT SHARE" | ssh-keygen -Y sign -n doubleblind.xyz -f ~/.ssh/id_rsa  | pbcopy
        </pre>
        2. Enter the signature in this page but do not share it with anyone else.
        <br/>

      </div>
      <div className="fields">
        <div>
          <label>Message</label>
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Signature</label>
          <textarea
            value={signature}
            onChange={(e) => {
              setSignature(e.currentTarget.value);
            }}
          />
        </div>
        <div>
          <label>Group Public Keys</label>
          <textarea
            ref={(c) => {
              if (c)
                c.innerHTML = DEFAULT_PUBLIC_KEY_1 + '\n' + DEFAULT_PUBLIC_KEY_2;
            }}
            style={{ height: 100, width: 400 }}
            onChange={(e) => {
              const lines = _.compact(e.currentTarget.value.split("\n"));
              try {
                const keys = lines.map((line) => sshpk.parseKey(line, "ssh"));
                setGroupKeys(keys);
              } catch (err) {
                setGroupKeys(null);
              }
            }}
          />
        </div>
      </div>
      <br />
      <h3>CIRCUIT INPUT</h3>
      <textarea
        style={{ height: 400, width: "100%" }}
        value={error || JSON.stringify(circuitInput)}
      />

      <br />
      <Merkle />
    </div>
  );
}
