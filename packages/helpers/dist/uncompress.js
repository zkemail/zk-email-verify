"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uncompressGz = void 0;
// @ts-ignore
const pako_1 = __importDefault(require("pako"));
// uncompresses single .gz file.
// returns the contents as an ArrayBuffer
const uncompressGz = async (arrayBuffer) => {
    const output = pako_1.default.ungzip(arrayBuffer);
    const buff = output.buffer;
    return buff;
};
exports.uncompressGz = uncompressGz;
