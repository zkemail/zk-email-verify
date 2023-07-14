
function modExp(a: bigint, b: number, c: bigint): bigint {
  let res = 1n;
  for (let i = 0; i < 30; ++i) {
    if ((b >> i) & 1) res = (res * a) % c;
    a = (a * a) % c;
  }
  return res;
}


export function verifyRSA(sig: bigint, modulus: bigint): bigint {
  return modExp(sig, 65537, modulus);
}