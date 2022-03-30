import { IGroupSignature, IIdentityRevealer } from "./types";

export function decodeGroupSignature(sigstring: string): IGroupSignature {
  return JSON.parse(atob(sigstring.trim().split("\n")[1]));
}

export function encodeGroupSignature(sig: IGroupSignature) {
  return (
    "----BEGIN DOUBLE-BLIND.XYZ SIGNATURE----\n" +
    btoa(JSON.stringify(sig)) +
    "\n----END DOUBLE-BLIND.XYZ SIGNATURE----"
  );
}

export function encodeIdentityRevealer(rev: IIdentityRevealer): string {
  return (
    "----BEGIN DOUBLE-BLIND.XYZ REVEALER----\n" +
    btoa(JSON.stringify(rev)) +
    "\n----END DOUBLE-BLIND.XYZ REVEALER----"
  );
}

export function decodeIdentityRevealer(revstring: string): IIdentityRevealer {
  return JSON.parse(atob(revstring.trim().split("\n")[1]));
}
