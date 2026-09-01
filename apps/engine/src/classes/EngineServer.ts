import type { Order } from "shared-types";
import type { MatchingEngine } from "./MatchingEngine";
import type { UserManager } from "./UserManager";
import type { RiskManager } from "./RiskManager";
import type { RedisManager } from "./RedisManager";
import type { OrderBook } from "./OrderBook";

export class EngineServer {
  private dbPoller?: any;
  constructor(
    private matchingEngine: MatchingEngine,
    private userManager: UserManager,
    private riskManager: RiskManager,
    private redisManager: RedisManager,
    private orderBook: OrderBook,
  ) {}
  setDBPoller(dbPoller: any) {
    this.dbPoller = dbPoller;
  }


  async start() {
    console.log("engine server started listening to send to engine");

    while (true) {
      const data = await this.redisManager.readFromBackendServer();
      if (!data) continue;
      for (const stream of data) {
        for (const entry of stream.messages) {
          const id = entry.id;
          const fields = entry.message as any;
          const raw = fields.data ?? fields["data"];
          if (!raw) {
            await this.redisManager.saveStreamId(id)
            continue;
          }
          try {
            const parsed = JSON.parse(raw);
            //TODO 
            // expected { type: "create-order", orderId, userId, marketId... }
            if (parsed.type === "create-order" || parsed.marketType) {
              const order: Order = {
                orderId: parsed.orderId,
                userId: parsed.userId,
                marketId: parsed.marketId,
                marketType: parsed.marketType ?? "LIMIT",
                orderType: parsed.orderType ?? parsed.marketType ?? "LIMIT",
                positionType: parsed.positionType,
                status: parsed.status ?? "OPEN",
                price: parsed.price,
                qty: parsed.qty,
                leverage: parsed.leverage,
                remainingQty: parsed.remainingQty ?? parsed.qty,
              };
              // lock the margin
              const margin = this.riskManager.calculateMargin(order);
              const user = this.userManager.getUser(order.userId);
              if (user) {
                if (margin > user.collateral.availabe) {
                  order.status = "CANCEL" as any;
                  continue;
                }
                this.userManager.lockBalance(user, margin);
                this.userManager.addOrder(order.userId, order as any);
              }
              this.matchingEngine.matchOrder(order);
            } else if (parsed.type === "cancel-order") {
              const price = this.orderBook.findOrderPrice(
                parsed.marketId,
                parsed.orderId,
              )

              const orderToCancel: Order = {
                orderId: parsed.orderId,
                userId: parsed.userId,
                marketId: parsed.marketId,
                marketType: "LIMIT",
                orderType: "LIMIT",
                positionType: parsed.positionType,
                status: "CANCEL",
                price: parsed.price ?? price,
                qty: parsed.qty ?? 0,
                leverage: parsed.leverage ?? 1,
                remainingQty: 0
              };

              this.orderBook.cancelOrder(orderToCancel);
              this.userManager.removeOrder(parsed.userId, parsed.orderId);
            }
          } catch (e) {
            console.error("engine parse error", e);
          }

          await this.redisManager.saveStreamId(id);
        }
      }
    }
  }
}
