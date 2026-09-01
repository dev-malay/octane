import type {
  dbPollerEvents,
  Fills,
  Order,
  positionType,
  UserPositions,
} from "shared-types";
import type { FillManager } from "./FillManager";
import type { OrderBook } from "./OrderBook";
import type { PositionManager } from "./PositionManager";
import type { RiskManager } from "./RiskManager";
import type { RedisManager } from "./RedisManager";
import type { UserManager } from "./UserManager";

export class MatchingEngine {
  private dbpoller?: any
  constructor(
    private orderBook: OrderBook,
    private fillsManager: FillManager,
    private positionManager: PositionManager,
    private riskManager: RiskManager,
    private redisManager: RedisManager,
    private userManager: UserManager,
  ) { }
  setDBPoller(dbpoller: any) {
    this.dbpoller = dbpoller;
  }
  private publishOrderUpdate(
    order: Order,
    orderChannel: string,
    type: "orderCreate" | "orderUpdate",
  ) {
    void this.redisManager.publish(orderChannel, {
      type,
      orderId: order.orderId,
    } as any);
  }
  private sendOrderDBUpdate(order: Order) {
    const ev: dbPollerEvents = {
      type: "OrderUpdate",
      payload: { method: "PUT", data: order },
    };
    this.dbpoller?.sendToDBPoller(ev);
  }
  private persistMakerOrderUpdate(restingOrder: Order) {
    restingOrder.status =
      restingOrder.remainingQty === 0 ? "FILLED" : "PARTIAL_FILLED";
    this.sendOrderDBUpdate(restingOrder);
  }
  private publishDepth(marketId: string) {
    const depth = this.orderBook.getDepth(marketId);
    const depthChannel = this.redisManager.createChannel("depth", marketId);
    void this.redisManager.publishWithSnapshot(depthChannel, {
      type: "depth",
      market: marketId,
      asks: depth.asks,
      bids: depth.bids,
    } as any);
  }
  private applyExecutionPrice(
    order: Order,
    tradeQty: number,
    tradePrice: number,
  ) {
    if (order.marketType !== "MARKET") return;
    const filledQty = order.qty - order.remainingQty;
    const priorFilledQty = filledQty - tradeQty;
    const priorNotional =
      order.price != null && priorFilledQty > 0
        ? order.price * priorFilledQty
        : 0;
    const totalFilledQty = priorFilledQty + tradeQty;
    order.price = (priorNotional + tradeQty * tradePrice) / totalFilledQty;
  }
  
  matchOrder(order: Order) {
    const book = this.orderBook.getBook(order.marketId);
    const ev: dbPollerEvents = {
      type: "OrderUpdate",
      payload: { method: "POST", data: order },
    };
    this.dbpoller?.sendToDBPoller(ev);
    const orderChannel = this.redisManager.createChannel(
      "order",
      order.marketId,
      order.userId,
    );
    this.publishOrderUpdate(order, orderChannel, "orderCreate");
    const response: any = {
      orderId: order.orderId,
      status: "",
      fills: [],
      remainingQuantity: order.qty,
      margin: { locked: 0 },
    };
    if (!book) throw new Error(`book ith ${order.marketId} does not exist`);
    let staleMatches = 0;
    while (order.remainingQty > 0) {
      const bestPrice = this.orderBook.getBestPrice(order.positionType, book);
      if (!bestPrice) break;
      if (order.marketType === "LIMIT" && order.price !== undefined) {
        if (order.positionType === "LONG" && bestPrice > order.price) break;
        if (order.positionType === "SHORT" && bestPrice < order.price) break;
      }
      const match = this.orderBook.updateRemainingQty(order, bestPrice);
      if (!match) {
        staleMatches++;
        if (staleMatches > 100) break;

        continue
      }
      staleMatches = 0;
      const { tradeQty, restingOrder } = match;
      this.orderBook.updateLastTradedPrice(order.marketId, bestPrice);
      this.applyExecutionPrice(order, tradeQty, bestPrice);
      const fill: Fills = {
        maker: restingOrder.userId,
        taker: order.userId,
        makerOrderId: restingOrder.orderId,
        takerOrderId: order.orderId,
        marketId: order.marketId,
        qty: tradeQty,
        price: bestPrice,
      };

      this.fillsManager.createFill(fill);
      response.fills.push(fill);
      this.dbpoller?.sendToDBPoller({
        type: "FillsCreated",
        payload: { method: "POST", data: fill },
      } as any);
      void this.redisManager.publish(
        this.redisManager.createChannel("trade", order.marketId),
        {
          type: "trades",
          marketId: order.marketId,
          price: bestPrice,
          qty: tradeQty,
          maker: restingOrder.userId,
          taker: order.userId,
          timestamp: Date.now(),
        } as any,
      );

      const takerFillMargin = (tradeQty * bestPrice) / order.leverage;
      const makerFillMargin = (tradeQty * bestPrice) / restingOrder.leverage;
      const existingTaker = this.positionManager.getPosition( order.userId, order.marketId );
      const existingMaker = this.positionManager.getPosition( restingOrder.userId,order.marketId);
      const takerPos: UserPositions = {
        marketId: order.marketId,
        positionType: order.positionType,
        qty: tradeQty,
        leverage: order.leverage,
        margin: takerFillMargin,
        maintainanceMargin:
          this.riskManager.calculateMaintainanceMargin(takerFillMargin),
        liquidationPrice: this.riskManager.calculateLiquidationMargin(
          bestPrice,
          order.leverage,
          order.positionType,
        ),
        pnL: 0,
        realisedPnL: 0,
        entryPrice: bestPrice,
        averagePrice: bestPrice,
        unrealisedPnL: 0,
      };
      const makerPos: UserPositions = {
        marketId: restingOrder.marketId,
        positionType: (order.positionType === "LONG"
          ? "SHORT"
          : "LONG") as positionType,
        qty: tradeQty,
        leverage: restingOrder.leverage,
        margin: makerFillMargin,
        maintainanceMargin:
          this.riskManager.calculateMaintainanceMargin(makerFillMargin),
        liquidationPrice: this.riskManager.calculateLiquidationMargin(
          bestPrice,
          restingOrder.leverage,
          restingOrder.positionType,
        ),
        pnL: 0,
        realisedPnL: 0,
        entryPrice: bestPrice,
        averagePrice: bestPrice,
        unrealisedPnL: 0,
      };
      if (!existingTaker) {
        this.positionManager.newPosition(order.userId, takerPos);
        this.dbpoller?.sendToDBPoller({
          type: "PositionUpdated",
          payload: {
            method: "POST",
            data: { userId: order.userId, position: takerPos },
          },
        } as any);
      } else
        this.positionManager.manipulatePositions(
          takerPos,
          existingTaker,
          order.userId,
        );
      if (!existingMaker) {
        this.positionManager.newPosition(restingOrder.userId, makerPos);
        this.dbpoller?.sendToDBPoller({
          type: "PositionUpdated",
          payload: {
            method: "POST",
            data: { userId: restingOrder.userId, position: makerPos },
          },
        } as any);
      } else
        this.positionManager.manipulatePositions(
          makerPos,
          existingMaker,
          restingOrder.userId,
        );
      this.persistMakerOrderUpdate(restingOrder);
    }

    if (order.marketType === "LIMIT" && order.remainingQty > 0)
      this.orderBook.addToBook(order);
    this.publishDepth(order.marketId);
    const filledQty = order.qty - order.remainingQty;
    if (order.remainingQty === 0) {
      order.status = "FILLED";
      this.sendOrderDBUpdate(order);
      this.publishOrderUpdate(order, orderChannel, "orderUpdate");
      response.status = "filled";
      return response;
    }
    if (filledQty > 0) {
      order.status = "PARTIAL_FILLED";
      this.sendOrderDBUpdate(order);
      this.publishOrderUpdate(order, orderChannel, "orderUpdate");
    }

    return response;
  }
}
