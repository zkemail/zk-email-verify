import "./styles.css";
import { useState } from "react";
import { useAsync } from "react-use";
import sshpk from "sshpk";
import _, { result } from "lodash";
const DEFAULT_PUBLIC_KEY =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDBN+ISLXgsf3xxG18ZSKAwARj/0mw0x8JGQoWuCcDB5C99bgC5CMIsm/7ZYHye6BdB7GbY3RV/aVuLzm2lh2Q9opPT2AJhWDdeYyLhrIRsexNfnUXZsETxI4M7P5mZXNHAVASG/Q/gu2lb1aPt5oOiRCI7tvitKLOGrUtb0/KToaityX2OJFmEnmH+RM6t2ICwmfObterWjzm+J5k1ydFjSSwkx669U/GWVf56Rruburz/XlDwUm9liVef5iTOH8/rSu82ejamZXoYJFCaSq3nCZRw8mb6xs+zoiYcKiGozlhg6Zbpkexr4i20vPR5d9rQItaZ38cmbk2HwZzpaqUx/t055CpmUQ2N/vfvzr3rUCeG0SkWsew0m8UDB0AU6LYKCQS50kr0KBYEtE+lt46iLf+5XrlBhFj99xqx5qOeSY9Pz8xuu3Ti2ckDKhyMTj9uONSBPVOxRslX8PK35L0lQdM8TOjKBpVAWx4Fyag93QWyPFdUD4kB+HHSo9FgC9vZxtoxPOpTf8GgIzspGVHL+MjW7QmBs+cD48K9k6XMmaSq1AEx1JjeysoO5d9bzTygyHAhyZtZftnaTQ6r8OjUGL+U9J16Ezp1CwxY8tHpIyh2e6HUuVE8CNkeKLf6j2VIgdQd7b+iSPtr3bc43tMYRW9576Qov/t8pP8gEla83w== stevenhao@gmail.com";
const DEFAULT_SIGNATURE = `-----BEGIN SSH SIGNATURE-----
U1NIU0lHAAAAAQAAAhcAAAAHc3NoLXJzYQAAAAMBAAEAAAIBAME34hIteCx/fHEbXxlIoD
ABGP/SbDTHwkZCha4JwMHkL31uALkIwiyb/tlgfJ7oF0HsZtjdFX9pW4vObaWHZD2ik9PY
AmFYN15jIuGshGx7E1+dRdmwRPEjgzs/mZlc0cBUBIb9D+C7aVvVo+3mg6JEIju2+K0os4
atS1vT8pOhqK3JfY4kWYSeYf5Ezq3YgLCZ85u16taPOb4nmTXJ0WNJLCTHrr1T8ZZV/npG
u5u6vP9eUPBSb2WJV5/mJM4fz+tK7zZ6NqZlehgkUJpKrecJlHDyZvrGz7OiJhwqIajOWG
DplumR7GviLbS89Hl32tAi1pnfxyZuTYfBnOlqpTH+3TnkKmZRDY3+9+/OvetQJ4bRKRax
7DSbxQMHQBTotgoJBLnSSvQoFgS0T6W3jqIt/7leuUGEWP33GrHmo55Jj0/PzG67dOLZyQ
MqHIxOP2441IE9U7FGyVfw8rfkvSVB0zxM6MoGlUBbHgXJqD3dBbI8V1QPiQH4cdKj0WAL
29nG2jE86lN/waAjOykZUcv4yNbtCYGz5wPjwr2TpcyZpKrUATHUmN7Kyg7l31vNPKDIcC
HJm1l+2dpNDqvw6NQYv5T0nXoTOnULDFjy0ekjKHZ7odS5UTwI2R4ot/qPZUiB1B3tv6JI
+2vdtzje0xhFb3nvpCi/+3yk/yASVrzfAAAABGZpbGUAAAAAAAAABnNoYTUxMgAAAhQAAA
AMcnNhLXNoYTItNTEyAAACADgBVSCYdweQfz/WROXduNeh0lqsxC+x1UwvJD3Wnh234L+r
vz7DoGAYagHsxBSoQMp7lyM0P4imAfigivdzWKs25LYHSsMpQIJPv0kgc1yhhVNmsKmQKh
6l2ahDYtKOJZcI8OXDmlpv5ZE1UGuoy4CyiVNglLHXPfHf9fS4OhInx90rlP3Hg31524cp
ji0tu6uDlesvZQpysAPK/ORy1JTcnLrK//zSuXUEo3syJVgDOehQY+dL1z0a7QiVVlwHbl
PUavCS302BCeadBAEaboeRfXZVrs7NdhjnrpZqnXJGkIoFvfOjz0uDOLj4x/VVLCdfJRZi
Vk1Xjv/4BR/7cjRh3UwqKkRU4tfwAGXS5xMnWO47lSsZeul23kHmWiO+hm6X5xrdzK7Hff
ByUGrbMs82Wo8tf5XOIVmI8ictFMf2Pq2Sui/HaekiIwsqIscibLc68VNxFpKlpYZYtPIw
ozIh5ERwEKWqRytEPmR0XJF7JBAqx4BF+aAPSNHZtzHp2eBZRHT0H3/ovdHgoNTCVt72SD
slHOP3nPPvM1YDklblGX2SW3Fm/0sf5GG0kceqQh7YdzNPeuoNFRY5r4ckn+67by8X95Ze
vzH9jlMVWnmECLjdJYIsOTMFdNU+yuHlxfrZ9ur0W4mZN6iIRI+FLj/GjrR7TkmYwz6sA4
X7iR5g
-----END SSH SIGNATURE-----`;
const SSH_MAGIC_PREAMBLE = "SSHSIG";

function bytesToString(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}
function bytesToInt(bytes) {
  return bytes[3] +
  256 * (bytes[2] + 256 * (bytes[1] + 256 * bytes[0]));
}
function intToBytes(int) {
  return [int / 256 / 256 / 256 % 256, int / 256 / 256 % 256, int / 256 % 256, int % 256];
}

function stringToBytes(str) {
  return Uint8Array.from(str, (x) => x.charCodeAt(0))
}

function packSshStrings(strings) {
  const result = [];
  for (const s of strings) {
    intToBytes(s.length).forEach((b) => result.push(b));
    stringToBytes(s).forEach((b) => result.push(b));
  }
  return bytesToString(new Uint8Array(result));
}

function unpackSshBytes(bytes, numStrings) {
  const result = [];
  let offset = 0;
  for (let i = 0; i < numStrings; ++i) {
    const lenBytes = bytes.slice(offset, offset + 4);
    // first 4 bytes is length in big endian
    const len = bytesToInt(lenBytes);
    console.log("len is", len);
    const str = bytesToString(bytes.slice(offset + 4, offset + 4 + len));
    result.push(str);
    offset += 4 + len;
  }
  return result;
}

async function H(str) {
  console.log("running H");
  return bytesToString(
    await crypto.subtle.digest(
      "SHA-512",
      stringToBytes(str),
    )
  );
}

async function getRawMessage(message, namespace, hash_algorithm) {
  return (
    "SSHSIG" + packSshStrings([namespace, "", hash_algorithm, await H(message)])
  );
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
  console.log(stringToBytes(pubKeyEncoded));
  const pubKeyParts = unpackSshBytes(
    stringToBytes(pubKeyEncoded),
    3
  );
  const rawSigParts = unpackSshBytes(stringToBytes(rawSignatureEncoded), 2);
  const rawSignature = rawSigParts[1];
  debugger;
  console.log("3. bignum bytes", pubKeyParts);
  console.log("4. sig is", rawSignature);
  return [rawSignature, namespace, hash_algorithm, pubKeyParts];
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
  const [message, setMessage] = useState("E PLURIBUS UNUM");
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);
  const { value: circuitInput } = useAsync(async () => {
    if (!rsaKey) return { error: "Invalid public key" };
    if (!groupKeys) return { error: "Invalid group keys" };
    console.log(rsaKey);
    const v = rsaKey.createVerify("sha512");
    const [
      rawSignature,
      namespace,
      hash_algorithm,
      pubKeyParts
    ] = getRawSignature(signature);
    const rawMessage = await getRawMessage(message, namespace, hash_algorithm);
    console.log("raw message is", rawMessage);
    v.update(rawMessage);
    const valid = v.verify(rawSignature);
    // const privateKey = ;
    // var s = privateKey.createSign('sha1');
    // s.update(data);
    return {
      valid
      // rsaKey,
      // groupKeys
      // signature[k];
      //  modulus[k];
      //  message[k];
      //  leaf;
      //  root;
      //  pathElements[levels];
      //  pathIndices[levels];
    };
  }, [rsaKey, message, groupKeys]);
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
        value={JSON.stringify(circuitInput, null, 2)}
      />
    </div>
  );
}
