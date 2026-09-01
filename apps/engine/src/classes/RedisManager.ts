export class RedisManager {
  async connect() { console.log("redis stub connected") }
  async publish(channel: string, data: any) { }
  async publishWithSnapshot(channel: string, data: any) { }
  getPublisherClient() { return null as any }
  createChannel(channel: string, market: string, userId?: string) {
    if (channel === "position" || channel === "order") {
      if (!userId) throw new Error("userId required");
      return channel + ":" + userId + ":" + market;
    }

    return channel + ":" + market;
  }
  
  async readFromBackendServer() { return null }
  async saveStreamId(id: string) { }
  async listenToBinanceWS(cb: any) { }
}
