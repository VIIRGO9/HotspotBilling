import { Channel } from "node-routeros/dist/Channel.js";

const originalOnUnknown = Channel.prototype.onUnknown;

Channel.prototype.onUnknown = function onUnknown(reply) {
  if (reply === "!empty") {
    if (!this.trapped) this.emit("done", this.data);
    this.close();
    return;
  }

  return originalOnUnknown.call(this, reply);
};
