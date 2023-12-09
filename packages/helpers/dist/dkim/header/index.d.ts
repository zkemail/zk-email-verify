/// <reference types="node" />
import { Options, SignatureType, SigningHeaderLines } from '../index';
export declare const generateCanonicalizedHeader: (type: SignatureType, signingHeaderLines: SigningHeaderLines, options: Options) => {
    canonicalizedHeader: Buffer;
    signatureHeaderLine: string;
    dkimHeaderOpts: boolean | Record<string, any>;
};
