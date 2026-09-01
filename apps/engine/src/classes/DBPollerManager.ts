import type { RedisClientType } from "redis";
import type { dbPollerEvents } from "shared-types";
export class DBPoller {
    constructor(private publisherClient:RedisClientType){}
    async sendToDBPoller(payloadData:dbPollerEvents){
      if(!payloadData) return
      if (!this.publisherClient) throw new Error("Redis publisher client is not connected")
      await this.publisherClient.XADD("send-to-dbpoller", "*", {"data":JSON.stringify(payloadData)})
    }
}
