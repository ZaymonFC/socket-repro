//
// Copyright 2022 DXOS.org
//

import { Duplex } from "socket:stream";
import { Event } from "@dxos/async";
import { invariant } from "@dxos/invariant";
import { log } from "@dxos/log";

const FRAME_LENGTH_SIZE = 2;

/**
 * Converts a stream of binary messages into a framed RpcPort.
 * Buffers are written prefixed by their length encoded as a varint.
 */
export class Framer {
  constructor() {
    this._messageCb = undefined;
    this._subscribeCb = undefined;
    this._buffer = undefined; // The rest of the bytes from the previous write call.
    this._sendCallbacks = [];

    this._bytesSent = 0;
    this._bytesReceived = 0;

    this._writable = true;

    this.drain = new Event();

    this._stream = new Duplex({
      objectMode: false,
      read: () => {
        this._processResponseQueue();
      },
      // For some reason in socket the next callback is undefined.
      write: (chunk, encoding, next) => {
        invariant(
          !this._subscribeCb,
          "Internal Framer bug. Concurrent writes detected.",
        );

        // NOTE: This should really have value ... ¯\_(ツ)_/¯
        if (typeof next !== "function") {
          throw new Error("Internal Framer bug. Write callback is missing.");
        }

        this._bytesReceived += chunk.length;

        if (this._buffer && this._buffer.length > 0) {
          this._buffer = Buffer.concat([this._buffer, chunk]);
        } else {
          this._buffer = chunk;
        }

        if (this._messageCb) {
          this._popFrames();
          if (typeof next === "function") next();
        } else {
          this._subscribeCb = () => {
            // Schedule the processing of the chunk after the peer subscribes to the messages.
            this._popFrames();
            this._subscribeCb = undefined;
            if (typeof next === "function") next();
          };
        }
      },
    });

    this.port = {
      send: (message) => {
        return new Promise((resolve) => {
          const frame = encodeFrame(message);
          this._bytesSent += frame.length;
          this._writable = this._stream.push(frame);
          if (!this._writable) {
            this._sendCallbacks.push(resolve);
          } else {
            resolve();
          }
        });
      },
      subscribe: (callback) => {
        invariant(!this._messageCb, "Rpc port already has a message listener.");
        this._messageCb = callback;
        if (this._subscribeCb) this._subscribeCb();
        return () => {
          this._messageCb = undefined;
        };
      },
    };
  }

  get stream() {
    return this._stream;
  }

  get bytesSent() {
    return this._bytesSent;
  }

  get bytesReceived() {
    return this._bytesReceived;
  }

  get writable() {
    return this._writable;
  }

  _processResponseQueue() {
    const responseQueue = this._sendCallbacks;
    this._sendCallbacks = [];
    this._writable = true;
    this.drain.emit();
    responseQueue.forEach((cb) => cb());
  }

  _popFrames() {
    let offset = 0;
    while (offset < this._buffer.length) {
      const frame = decodeFrame(this._buffer, offset);

      if (!frame) {
        break; // Couldn't read frame but there are still bytes left in the buffer.
      }
      offset += frame.bytesConsumed;
      this._messageCb(frame.payload);
    }

    if (offset < this._buffer.length) {
      // Save the rest of the bytes for the next write call.
      this._buffer = this._buffer.subarray(offset);
    } else {
      this._buffer = undefined;
    }
  }

  destroy() {
    if (this._stream.readableLength > 0) {
      log("framer destroyed while there are still read bytes in the buffer.");
    }
    if (this._stream.writableLength > 0) {
      log.warn(
        "framer destroyed while there are still write bytes in the buffer.",
      );
    }
    this._stream.destroy();
  }
}

export const decodeFrame = (buffer, offset) => {
  if (buffer.length < offset + FRAME_LENGTH_SIZE) {
    // Not enough bytes to read the frame length.
    return undefined;
  }

  const frameLength = buffer.readUInt16BE(offset);
  const bytesConsumed = FRAME_LENGTH_SIZE + frameLength;

  if (buffer.length < offset + bytesConsumed) {
    // Not enough bytes to read the frame.
    return undefined;
  }

  const payload = buffer.subarray(
    offset + FRAME_LENGTH_SIZE,
    offset + bytesConsumed,
  );

  return {
    payload,
    bytesConsumed,
  };
};

export const encodeFrame = (payload) => {
  const frame = Buffer.allocUnsafe(FRAME_LENGTH_SIZE + payload.length);
  frame.writeUInt16BE(payload.length, 0);
  frame.set(payload, FRAME_LENGTH_SIZE);
  return frame;
};
