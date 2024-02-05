"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCanonicalizedHeader = void 0;
const relaxed_1 = require("./relaxed");
const simple_1 = require("./simple");
const generateCanonicalizedHeader = (type, signingHeaderLines, options) => {
    options = options || {};
    let canonicalization = (options.canonicalization || 'simple/simple').toString()?.split('/')?.shift()?.toLowerCase().trim();
    switch (canonicalization) {
        case 'simple':
            return (0, simple_1.simpleHeaders)(type, signingHeaderLines, options);
        case 'relaxed':
            return (0, relaxed_1.relaxedHeaders)(type, signingHeaderLines, options);
        default:
            throw new Error('Unknown header canonicalization');
    }
};
exports.generateCanonicalizedHeader = generateCanonicalizedHeader;
