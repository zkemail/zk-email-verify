/// <reference types="node" />
declare const headerParser: (buf: Buffer | string) => {
    parsed: {
        [key: string]: any;
    };
    original: string | Buffer;
};
export default headerParser;
