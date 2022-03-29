export function stringToBytes(str: string) {
  return Uint8Array.from(str, (x) => x.charCodeAt(0));
}


export function bytesToBigInt(bytes: Uint8Array) {
  let res = 0n;
  for (let i = 0; i < bytes.length; ++i) {
    res = (res << 8n) + BigInt(bytes[i]);
  }
  return res;
}
