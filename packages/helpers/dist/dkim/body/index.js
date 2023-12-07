"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dkimBody = void 0;
const simple_1 = require("./simple");
const relaxed_1 = require("./relaxed");
const dkimBody = (canonicalization, ...options) => {
    canonicalization = (canonicalization ?? 'simple/simple').toString().split('/').pop()?.toLowerCase().trim();
    switch (canonicalization) {
        case 'simple':
            return new simple_1.SimpleHash(...options);
        case 'relaxed':
            return new relaxed_1.RelaxedHash(...options);
        default:
            throw new Error('Unknown body canonicalization');
    }
};
exports.dkimBody = dkimBody;
