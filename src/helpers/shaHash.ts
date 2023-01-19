import { createHash } from "crypto";
// const { webcrypto, KeyObject } = await import('crypto');
// const { subtle } = webcrypto;
import { Hash } from "./fast-sha256";

export async function shaHash(str: Uint8Array) {
  return createHash("sha256").update(str).digest();
}

export async function partialSha(msg: Uint8Array, msgLen: number): Promise<Uint8Array> {
  const shaGadget = new Hash();
  return await shaGadget.update(msg, msgLen).cacheState();
}
