// Calculates relaxed body hash for a message body stream
import { Writable, WritableOptions } from 'stream';
import { parseHeaders } from './tools';
import type { ParsedHeaders } from './dkim-verifier';

/**
 * Class for separating header from body
 *
 * @class
 * @extends Writable
 */
export class MessageParser extends Writable {
  byteLength: number;
  headers: ParsedHeaders | boolean;
  private state: string;
  private stateBytes: unknown[];
  private headerChunks: Buffer[];
  private lastByte: number = 0;
  constructor(options?: WritableOptions) {
    super(options);

    this.byteLength = 0;

    this.state = 'header';
    this.stateBytes = [];

    this.headers = false;
    this.headerChunks = [];
  }

  async nextChunk(...args: any) {
    // Override in child class
  }

  async finalChunk(...args: any) {
    // Override in child class
  }

  async messageHeaders(headers: ParsedHeaders) {
    // Override in child class
  }

  async processChunk(chunk: Buffer) {
    if (!chunk || !chunk.length) {
      return;
    }

    if (this.state === 'header') {
      // wait until we have found body part
      for (let i = 0; i < chunk.length; i++) {
        let c = chunk[i];
        this.stateBytes.push(c);
        if (this.stateBytes.length > 4) {
          this.stateBytes = this.stateBytes.slice(-4);
        }

        let b0 = this.stateBytes[this.stateBytes.length - 1];
        let b1 = this.stateBytes.length > 1 && this.stateBytes[this.stateBytes.length - 2];
        let b2 = this.stateBytes.length > 2 && this.stateBytes[this.stateBytes.length - 3];

        if (b0 === 0x0a && (b1 === 0x0a || (b1 === 0x0d && b2 === 0x0a))) {
          // found header ending
          this.state = 'body';
          if (i === chunk.length - 1) {
            //end of chunk
            this.headerChunks.push(chunk);
            this.headers = parseHeaders(Buffer.concat(this.headerChunks));
            await this.messageHeaders(this.headers);
            return;
          }
          this.headerChunks.push(chunk.subarray(0, i + 1));
          this.headers = parseHeaders(Buffer.concat(this.headerChunks));
          await this.messageHeaders(this.headers);
          chunk = chunk.subarray(i + 1);
          break;
        }
      }
    }

    if (this.state !== 'body') {
      this.headerChunks.push(chunk);
      return;
    }

    await this.nextChunk(chunk);
  }

  *ensureLinebreaks(input: Buffer) {
    let pos = 0;
    for (let i = 0; i < input.length; i++) {
      let c = input[i];
      if (c !== 0x0a) {
        this.lastByte = c;
      } else if (this.lastByte !== 0x0d) {
        // emit line break
        let buf;
        if (i === 0 || pos === i) {
          buf = Buffer.from('\r\n');
        } else {
          buf = Buffer.concat([input.subarray(pos, i), Buffer.from('\r\n')]);
        }
        yield buf;

        pos = i + 1;
      }
    }
    if (pos === 0) {
      yield input;
    } else if (pos < input.length) {
      let buf = input.subarray(pos);
      yield buf;
    }
  }

  async writeAsync(chunk: any, encoding: BufferEncoding) {
    if (!chunk || !chunk.length) {
      return;
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding);
    }

    for (let partialChunk of this.ensureLinebreaks(chunk)) {
      // separate chunk is emitted for every line that uses \n instead of \r\n
      await this.processChunk(partialChunk);
      this.byteLength += partialChunk.length;
    }
  }

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.writeAsync(chunk, encoding)
      .then(() => callback())
      .catch((err) => callback(err));
  }

  async finish() {
    // generate final hash and emit it
    await this.finalChunk();

    if (!this.headers && this.headerChunks.length) {
      this.headers = parseHeaders(Buffer.concat(this.headerChunks));
      await this.messageHeaders(this.headers);
    }
  }

  _final(callback: (error?: Error | null) => void) {
    this.finish()
      .then(() => callback())
      .catch((err) => callback(err));
  }
}
