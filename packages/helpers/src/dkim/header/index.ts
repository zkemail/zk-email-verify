import { Options, SignatureType, SigningHeaderLines } from '../index';
import { relaxedHeaders } from './relaxed';
import { simpleHeaders } from './simple';

export const generateCanonicalizedHeader = (type: SignatureType, signingHeaderLines: SigningHeaderLines, options: Options) => {
    options = options || {};
    let canonicalization = (options.canonicalization || 'simple/simple').toString()?.split('/')?.shift()?.toLowerCase().trim();
    switch (canonicalization) {
        case 'simple':
            return simpleHeaders(type, signingHeaderLines, options);
        case 'relaxed':
            return relaxedHeaders(type, signingHeaderLines, options);
        default:
            throw new Error('Unknown header canonicalization');
    }
};
