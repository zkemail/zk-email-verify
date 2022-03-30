import { IGroupSignature, IIdentityRevealer } from "./types";

export function decodeGroupSignature(sigstring: string): IGroupSignature {
  return JSON.parse(atob(sigstring.trim().split("\n")[1]));
}

export function encodeGroupSignature(sig: IGroupSignature) {
  return (
    "----BEGIN DOUBLEBLIND.XYZ SIGNATURE----\n" +
    btoa(JSON.stringify(sig)) +
    "\n----END DOUBLEBLIND.XYZ SIGNATURE----"
  );
}

export function encodeIdentityRevealer(rev: IIdentityRevealer): string {
  return (
    "----BEGIN DOUBLEBLIND.XYZ REVEALER----\n" +
    btoa(JSON.stringify(rev)) +
    "\n----END DOUBLEBLIND.XYZ REVEALER----"
  );
}

export function decodeIdentityRevealer(revstring: string): IIdentityRevealer {
  return JSON.parse(atob(revstring.trim().split("\n")[1]));
}
