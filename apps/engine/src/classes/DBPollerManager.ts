import type { dbPollerEvents } from "shared-types";
export class DBPoller {
    constructor(private publisherClient:any){}
    async sendToDBPoller(payloadData:dbPollerEvents){ /* stub - no redis in iter-2 */ }
}
