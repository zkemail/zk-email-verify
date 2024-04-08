const IS_BROWSER = typeof window !== "undefined";

// @ts-ignore
import addressparser from "addressparser";
import * as crypto from "crypto";
import { getSigningHeaderLines, getPublicKey, parseDkimHeaders, formatAuthHeaderRow, getAlignment, parseHeaders } from "./tools";
import { MessageParser } from "./message-parser";
import { dkimBody } from "./body";
import { generateCanonicalizedHeader } from "./header";


export type SignatureType = "DKIM" | "ARC" | "AS";

export type ParsedHeaders = ReturnType<typeof parseHeaders>;

export type Parsed = ParsedHeaders["parsed"][0];

export type ParseDkimHeaders = ReturnType<typeof parseDkimHeaders>;

export type SigningHeaderLines = ReturnType<typeof getSigningHeaderLines>;

export interface Options {
  signatureHeaderLine: string;
  signingDomain?: string;
  selector?: string;
  algorithm?: string;
  canonicalization: string;
  bodyHash?: string;
  signTime?: string | number | Date;
  signature?: string;
  instance: string | boolean;
  bodyHashedBytes?: string;
}


export class DkimVerifier extends MessageParser {
  envelopeFrom: string | boolean;
  headerFrom: string[];
  results: { [key: string]: any }[];
  private options: Record<string, any>;
  private resolver: (...args: [name: string, type: string]) => Promise<any>;
  private minBitLength: number;
  private signatureHeaders: ParseDkimHeaders[] & { [key: string]: any }[];
  private bodyHashes: Map<string, any>;
  private arc: { chain: false };
  private seal: { bodyHash: string; };
  private sealBodyHashKey: string = '';
  constructor(options: Record<string, any>) {
    super();

    this.options = options || {};
    this.resolver = this.options.resolver;
    this.minBitLength = this.options.minBitLength;

    this.results = [];

    this.signatureHeaders = [] as any;
    this.bodyHashes = new Map();

    this.headerFrom = [];
    this.envelopeFrom = false;

    // ARC verification info
    this.arc = { chain: false };

    // should we also seal this message using ARC
    this.seal = this.options.seal;

    if (this.seal) {
      // calculate body hash for the seal
      let bodyCanon = "relaxed";
      let hashAlgo = "sha256";
      this.sealBodyHashKey = `${bodyCanon}:${hashAlgo}:`;
      this.bodyHashes.set(this.sealBodyHashKey, dkimBody(bodyCanon, hashAlgo, 0));
    }
  }

  async messageHeaders(headers: ParsedHeaders) {
    this.headers = headers;

    this.signatureHeaders = headers.parsed
      .filter((h) => h.key === "dkim-signature")
      .map((h) => {
        const value: ParseDkimHeaders & { [key: string]: any } = parseDkimHeaders(h.line);
        value.type = "DKIM";
        return value;
      });

    let fromHeaders = headers?.parsed?.filter((h) => h.key === "from");
    for (const fromHeader of fromHeaders) {
      let fromHeaderString = fromHeader.line.toString();
      let splitterPos = fromHeaderString.indexOf(":");
      if (splitterPos >= 0) {
        fromHeaderString = fromHeaderString.substr(splitterPos + 1);
      }
      let from = addressparser(fromHeaderString.trim());
      for (let addr of from) {
        if (addr && addr.address) {
          this.headerFrom.push(addr.address);
        }
      }
    }

    if (this.options.sender) {
      let returnPath = addressparser(this.options.sender);
      this.envelopeFrom = returnPath.length && returnPath[0].address ? returnPath[0].address : false;
    } else {
      let returnPathHeader = headers.parsed.filter((h) => h.key === "return-path").pop();
      if (returnPathHeader) {
        let returnPathHeaderString = returnPathHeader.line.toString();
        let splitterPos = returnPathHeaderString.indexOf(":");
        if (splitterPos >= 0) {
          returnPathHeaderString = returnPathHeaderString.substr(splitterPos + 1);
        }
        let returnPath = addressparser(returnPathHeaderString.trim());
        this.envelopeFrom = returnPath.length && returnPath[0].address ? returnPath[0].address : false;
      }
    }

    for (let signatureHeader of this.signatureHeaders) {
      signatureHeader.algorithm = signatureHeader.parsed?.a?.value || "";
      signatureHeader.signAlgo = signatureHeader.algorithm.split("-").shift().toLowerCase().trim();
      signatureHeader.hashAlgo = signatureHeader.algorithm.split("-").pop().toLowerCase().trim();

      signatureHeader.canonicalization = signatureHeader.parsed?.c?.value || "";
      signatureHeader.headerCanon = signatureHeader.canonicalization.split("/").shift().toLowerCase().trim() || "simple";
      // if body canonicalization is not set, then defaults to 'simple'
      signatureHeader.bodyCanon = (signatureHeader.canonicalization.split("/")[1] || "simple").toLowerCase().trim();

      signatureHeader.signingDomain = signatureHeader.parsed?.d?.value || "";
      signatureHeader.selector = signatureHeader.parsed?.s?.value || "";

      signatureHeader.maxBodyLength = signatureHeader.parsed?.l?.value && !isNaN(signatureHeader.parsed?.l?.value) ? signatureHeader.parsed?.l?.value : "";

      const validSignAlgo = ["rsa", "ed25519"];
      const validHeaderAlgo = signatureHeader.type === "DKIM" ? ["sha256", "sha1"] : ["sha256"];
      const validHeaderCanon = signatureHeader.type !== "AS" ? ["relaxed", "simple"] : ["relaxed"];
      const validBodyCanon = signatureHeader.type !== "AS" ? ["relaxed", "simple"] : ["relaxed"];

      if (
        !validSignAlgo.includes(signatureHeader.signAlgo) ||
        !validHeaderAlgo.includes(signatureHeader.hashAlgo) ||
        !validHeaderCanon.includes(signatureHeader.headerCanon) ||
        !validBodyCanon.includes(signatureHeader.bodyCanon) ||
        !signatureHeader.signingDomain ||
        !signatureHeader.selector
      ) {
        signatureHeader.skip = true;
        continue;
      }

      signatureHeader.bodyHashKey = [signatureHeader.bodyCanon, signatureHeader.hashAlgo, signatureHeader.maxBodyLength].join(":");
      if (!this.bodyHashes.has(signatureHeader.bodyHashKey)) {
        this.bodyHashes.set(signatureHeader.bodyHashKey, dkimBody(signatureHeader.bodyCanon, signatureHeader.hashAlgo, signatureHeader.maxBodyLength));
      }
    }
  }

  async nextChunk(chunk: Buffer) {
    for (let bodyHash of this.bodyHashes.values()) {
      bodyHash.update(chunk);
    }
  }

  async finalChunk() {
    try {
      if (!this.headers || !this.bodyHashes.size) {
        return;
      }

      // convert bodyHashes from hash objects to base64 strings
      for (let [key, bodyHash] of this.bodyHashes.entries()) {
        this.bodyHashes.get(key).hash = bodyHash.digest("base64");
      }

      for (let signatureHeader of this.signatureHeaders) {
        if (signatureHeader.skip) {
          // TODO: add failing header line?
          continue;
        }

        let signingHeaderLines = getSigningHeaderLines((this.headers as { parsed: { key: string | null; casedKey: string | undefined; line: Buffer; }[]; original: Buffer; }).parsed, signatureHeader.parsed?.h?.value, true);

        let { canonicalizedHeader } = generateCanonicalizedHeader(signatureHeader.type, signingHeaderLines as any, {
          signatureHeaderLine: signatureHeader.original as string,
          canonicalization: signatureHeader.canonicalization,
          instance: ["ARC", "AS"].includes(signatureHeader.type) ? signatureHeader.parsed?.i?.value : false,
        });

        let signingHeaders = {
          keys: signingHeaderLines.keys,
          headers: signingHeaderLines.headers.map((l) => l.line.toString()),
        };

        let publicKey, rr, modulusLength;
        let status: { [key: string]: any } = {
          result: "neutral",
          comment: false,
          // ptype properties
          header: {
            // signing domain
            i: signatureHeader.signingDomain ? `@${signatureHeader.signingDomain}` : false,
            // dkim selector
            s: signatureHeader.selector,
            // algo
            a: signatureHeader.parsed?.a?.value,
            // signature value
            b: signatureHeader.parsed?.b?.value ? `${signatureHeader.parsed?.b?.value.substr(0, 8)}` : false,
          },
        };

        if (signatureHeader.type === "DKIM" && this.headerFrom?.length) {
          status.aligned = this.headerFrom?.length ? getAlignment(this.headerFrom[0] ?? ''.split("@")?.pop(), [signatureHeader.signingDomain]) : false;
        }

        let bodyHashObj = this.bodyHashes.get(signatureHeader.bodyHashKey);
        let bodyHash = bodyHashObj?.hash;
        if (signatureHeader.parsed?.bh?.value !== bodyHash) {
          status.result = "neutral";
          status.comment = `body hash did not verify`;
        } else {
          try {
            let res = await getPublicKey(signatureHeader.type, `${signatureHeader.selector}._domainkey.${signatureHeader.signingDomain}`, this.minBitLength, this.resolver);

            publicKey = res?.publicKey;
            rr = res?.rr;
            modulusLength = res?.modulusLength;

            try {
              let ver_result = false;
              if (!IS_BROWSER) {
                ver_result = crypto.verify(
                  signatureHeader.signAlgo === "rsa" ? signatureHeader.algorithm : null,
                  canonicalizedHeader,
                  publicKey,
                  Buffer.from(signatureHeader.parsed?.b?.value, "base64")
                );
              } else {
                let ver = crypto.createVerify("RSA-SHA256");
                ver.update(canonicalizedHeader);
                ver_result = ver.verify({ key: publicKey.toString(), format: "pem" }, Buffer.from(signatureHeader.parsed?.b?.value, "base64"));
              }

              status.signedHeaders = canonicalizedHeader;
              status.result = ver_result ? "pass" : "fail";

              if (status?.result === "fail") {
                status.comment = "bad signature";
              }
            } catch (err: any) {
              status.comment = err.message;
              status.result = "neutral";
            }
          } catch (err: any) {
            if (err.rr) {
              rr = err.rr;
            }

            switch (err.code) {
              case "ENOTFOUND":
              case "ENODATA":
                status.result = "neutral";
                status.comment = `no key`;
                break;

              case "EINVALIDVER":
                status.result = "neutral";
                status.comment = `unknown key version`;
                break;

              case "EINVALIDTYPE":
                status.result = "neutral";
                status.comment = `unknown key type`;
                break;

              case "EINVALIDVAL":
                status.result = "neutral";
                status.comment = `invalid public key`;
                break;

              case "ESHORTKEY":
                status.result = "policy";
                if (!status.policy) {
                  status.policy = {};
                }
                status.policy["dkim-rules"] = `weak-key`;
                break;

              default:
                status.result = "temperror";
                status.comment = `DNS failure: ${err.code || err.message}`;
            }
          }
        }

        signatureHeader.bodyHashedBytes = this.bodyHashes.get(signatureHeader.bodyHashKey)?.bodyHashedBytes;

        if (typeof signatureHeader.maxBodyLength === "number" && signatureHeader.maxBodyLength !== signatureHeader.bodyHashedBytes) {
          status.result = "fail";
          status.comment = `invalid body length ${signatureHeader.bodyHashedBytes}`;
        }

        let result: { [key: string]: any } = {
          signingDomain: signatureHeader.signingDomain,
          selector: signatureHeader.selector,
          signature: signatureHeader.parsed?.b?.value,
          algo: signatureHeader.parsed?.a?.value,
          format: signatureHeader.parsed?.c?.value,
          bodyHash,
          bodyHashExpecting: signatureHeader.parsed?.bh?.value,
          body: bodyHashObj?.fullBody,
          signingHeaders,
          status,
        };

        if (typeof signatureHeader.bodyHashedBytes === "number") {
          result.canonBodyLength = signatureHeader.bodyHashedBytes;
        }

        if (typeof signatureHeader.maxBodyLength === "number") {
          result.bodyLengthCount = signatureHeader.maxBodyLength;
        }

        if (publicKey) {
          result.publicKey = publicKey.toString();
        }

        if (modulusLength) {
          result.modulusLength = modulusLength;
        }

        if (rr) {
          result.rr = rr;
        }

        if (typeof result.status.comment === "boolean") {
          delete result.status.comment;
        }

        switch (signatureHeader.type) {
          case "ARC":
            throw Error("ARC not possible");
            break;
          case "DKIM":
          default:
            this.results.push(result);
            break;
        }
      }
    } finally {
      if (!this.results.length) {
        this.results.push({
          status: {
            result: "none",
            comment: "message not signed",
          },
        });
      }

      this.results.forEach((result) => {
        result.info = formatAuthHeaderRow("dkim", result.status);
      });
    }

    if (this.seal && this.bodyHashes.has(this.sealBodyHashKey) && typeof this.bodyHashes.get(this.sealBodyHashKey)?.hash === "string") {
      this.seal.bodyHash = this.bodyHashes.get(this.sealBodyHashKey).hash;
    }
  }
}
