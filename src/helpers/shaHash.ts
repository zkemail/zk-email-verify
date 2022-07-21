import { createHash } from "crypto";
// const { webcrypto, KeyObject } = await import('crypto');
// const { subtle } = webcrypto;

export async function shaHash(str: string) {
  return await createHash("sha256").update(str).digest("hex");
}
