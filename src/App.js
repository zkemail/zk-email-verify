/* global BigInt */

import "./styles.css";
import { useState } from "react";
import { useAsync } from "react-use";
import sshpk from "sshpk";
import _, { result } from "lodash";

import Merkle from "./Merkle";

const DEFAULT_PUBLIC_KEY =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN+ISLXgsf3xxG18ZSKAwARj/0mw0x8JGQoWuCcDB5C99bgC5CMIsm/7ZYHye6BdB7GbY3RV/aVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG/Q/gu2lb1aPt5oOiRCI7tvitKLOGrUtb0/KToaityX2OJFmEnmH+RM6t2ICwmfObterWjzm+J5k1ydFjSSwkx669U/GWVf56Rruburz/XlDwUm9liVef5iTOH8/rSu82ejamZXoYJFCaSq3nCZRw8mb6xs+zoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx/t055CpmUQ2N/vfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE+lt46iLf+5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB+HHSo9FgC9vZxtoxPOpTf8GgIzspGVHL+MjW7QmBs+cD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL+U9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b+iSPtr3bc43tMYRW9576Qov/t8pP8gEla83w== stevenhao@gmail.com";
const DEFAULT_SIGNATURE = `
-----BEGIN SSH SIGNATURE-----
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
-----END SSH SIGNATURE-----
`;
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

async function getRawMessage(message, namespace, hash_algorithm) {
  return concatBytes(stringToBytes(SSH_MAGIC_PREAMBLE), packSshStrings([namespace, stringToBytes(SSH_RESERVED), hash_algorithm, await H(stringToBytes(message))]));
}

function getRawSignature(signature) {
  // 0. strip out "armor" headers (lines that start with -----)
  // 1. base64 -d
  // 2. skipping first 10 bytes (for MAGIC_PREAMBLE and SIG_VERSION), unpack into 5 strings: publickey, namespace, reserved, hash_algorithm, signature
  // 3. convert public key and signature to bignum
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
const CIRCOM_BIGINT_LEVELS = 30;
function toCircomBigIntBytes(num) {
  const res = [];
  const msk = (1n << BigInt(CIRCOM_BIGINT_N)) - 1n;
  for (let i = 0; i < CIRCOM_BIGINT_K; ++i) {
    res.push(((num >> BigInt(i * CIRCOM_BIGINT_N)) & msk).toString());
  }
  return res;
}

// #define MAGIC_PREAMBLE "SSHSIG"
// byte[6]   MAGIC_PREAMBLE
// string    namespace
// string    reserved
// string    hash_algorithm
// string    H(message)

export default function App() {
  const [rsaKey, setRsaKey] = useState(
    sshpk.parseKey(DEFAULT_PUBLIC_KEY, "ssh")
  );
  const [groupKeys, setGroupKeys] = useState([
    sshpk.parseKey(DEFAULT_PUBLIC_KEY, "ssh"),
    sshpk.parseKey(DEFAULT_PUBLIC_KEY, "ssh")
  ]);
  const [message, setMessage] = useState("E PLURIBUS UNUM; DO NOT SHARE");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const { value: circuitInput, error } = useAsync(async () => {
    if (!rsaKey) return { error: "Invalid public key" };
    if (!groupKeys) return { error: "Invalid group keys" };
    console.log(rsaKey);
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
    const valid = equalArrays(pubKeyParts[2], rsaKey.parts[1].data);
    const modulusBigInt = bytesToBigInt(pubKeyParts[2]);
    const signatureBigInt = bytesToBigInt(rawSignature);
    console.log(signatureBigInt);
    const messageBigInt = modExp(signatureBigInt, 65537, modulusBigInt);
    console.log('valid is', valid);
    console.log('message bigint is', messageBigInt);
    const baseMessageBigInt = messageBigInt & ((1n << BigInt(MAGIC_DOUBLE_BLIND_BASE_MESSAGE_HEX.length * 4)) - 1n);
    console.log('base message bigint is', baseMessageBigInt);
    const validMessage = !!MAGIC_DOUBLE_BLIND_REGEX.exec(messageBigInt.toString(16));
    console.log('validMessage is', validMessage);
    
    // modExp(bytesToBigInt(rawSignature), 65537, bytesToBigInt(data.modulusBytes))

    return {
      // parts: rsaKey.parts,
      valid,
      validMessage,
      error,
      signature: toCircomBigIntBytes(signatureBigInt),
      modulus: toCircomBigIntBytes(modulusBigInt),
      padded_message: toCircomBigIntBytes(messageBigInt),
      base_message: toCircomBigIntBytes(baseMessageBigInt),
      //  leaf;
      //  root;
      //  pathElements[levels];
      //  pathIndices[levels];
    };
  }, [rsaKey, signature, message, groupKeys]);
  return (
    <div className="App">
      <h2>Zero Knowledge RSA Group Signature Generator</h2>
      <div className="fields">
        <div>
          <label>Your Public Key</label>
          <textarea
            style={{ height: 50, width: 400 }}
            ref={(c) => {
              if (c) c.innerText = DEFAULT_PUBLIC_KEY;
            }}
            onChange={(e) => {
              try {
                const key = sshpk.parseKey(e.currentTarget.value, "ssh");
                setRsaKey(key);
              } catch (err) {
                setRsaKey(null);
              }
            }}
          />
        </div>
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
                c.innerHTML = DEFAULT_PUBLIC_KEY + "\n" + DEFAULT_PUBLIC_KEY;
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
