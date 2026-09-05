// @ts-nocheck
import { Router } from "express";
import type { Response, Request } from "express";
import { authAdminMiddleware, authUserMiddleware } from "../middleware/auth.js";
import { createRedisConnection } from "redis-client";
import type { RedisClientType } from "redis";
import db from "@prisma-db"; 
import crypto from "crypto";
import { CreateOrderSchema, cancelOrdersSchema, createMarketSchema } from "shared-types";

const routes = Router();

let redisClient: RedisClientType | null;
export async function connectRedisBackend() {
  redisClient = await createRedisConnection();
  console.log("connected backend with redis")
  return redisClient;
}

connectRedisBackend();
routes.post(
  "/create-order",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const result = CreateOrderSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ error: result.error.flatten() });
    const userId = req.userId!;
    const { price, qty, marketId, orderType, positionType, leverage } =
      result.data;
    if (!redisClient) {
      res.status(400).json({ message: "unable to start redis" });
      return;
    }
    const orderId = crypto.randomUUID();
    const res1 = await redisClient.XADD("send-to-engine", "*", {
      type: "create-order",
      reqId: crypto.randomUUID(),
      orderId,
      userId,
      marketId,
      qty: qty.toString(),
      price: price.toString(),
      leverage: leverage.toString(),
      remainingQty: qty.toString(),
      orderType,
      positionType,
      status: "OPEN"
    });

    res.status(200).json({ message: `order Accepted`, orderId, queueId: res1});
  }
);

routes.post(
  "/cancel-order/:orderId",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const orderId = String(req.params.orderId ?? "");
    if (!orderId) return res.status(400).json({ message: "orderId required" });
    const result = cancelOrdersSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ error: result.error.flatten() });
    if (!redisClient) {
      res.status(400).json({ message: "unable to start redis" });
      return;

    }

    const userId = req.userId!;
    const { marketId, price, positionType, qty, leverage, orderType } =
      result.data;
    const dbOrder = await (db as any).orders.findUnique({
      where: { id: orderId },
    });

    if (dbOrder) {
      if (dbOrder.userId !== userId)
        return res.status(403).json({ message: "not authoriized to cancel this order" });
      if (!["OPEN", "PARTIALLY_FILLED"].includes(dbOrder.orderStatus))
        return res.status(400).json({ message: "order is not open" });
      if (dbOrder.marketId !== marketId)
        return res.status(400).json({ message: "marketId does not match order" });
    }

    const resolvedPrice = dbOrder?.price ?? price;
    const resolvedQty =
      dbOrder && dbOrder.remainingQty > 0
        ? dbOrder.remainingQty
        : qty > 0
          ? qty
          : (dbOrder?.qty ?? qty);
    const resolvedOrderQty = dbOrder?.qty ?? qty;
    const resolvedLeverage = dbOrder?.leverage ?? leverage;
    const resolvedPositionType = dbOrder?.positionType ?? positionType;
    const resolvedOrderType = dbOrder?.orderType ?? orderType;

    await redisClient.XADD("send-to-engine", "*", {
      type: "cancel-order",
      orderId,
      userId,
      marketId,
      price: resolvedPrice.toString(),
      qty: resolvedOrderQty.toString(),
      remainingQty: resolvedQty.toString(),
      leverage: resolvedLeverage.toString(),
      orderType: resolvedOrderType,
      positionType: resolvedPositionType
    });
    res.status(200).json({ message: "request accepted to cancel the order" });
  }
);

routes.post(
  "/create-market",
  authAdminMiddleware,
  async (req: Request, res: Response) => {
    const result = createMarketSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ error: result.error.flatten() });
    const { marketName, marketId, maxLeverage, symbol } = result.data;
    if (!redisClient) {
      res.status(400).json({ message: "unable to start redis" });
      return
    }
    const res1 = await redisClient.xAdd("send-to-engine", "*", {
      type: "create-market",
      marketId,
      marketName,
      maxLeverage: maxLeverage.toString(),
      symbol
    });
    res.status(200).json({ message: `recieved ${res1}` });
  }
);

routes.get("/get-markets", async (_req: Request, res: Response) => {
  const markets = await (db as any).markets.findMany();
  res.status(200).json({ markets })
});

routes.get(
  "/get-orders/:marketId",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const marketId = req.params.marketId;
    if (typeof marketId !== "string")
      return res.status(400).json({ message: "marketId required" });
    const orders = await (db as any).orders.findMany({
      where: { marketId, userId: req.userId },
    });
    res.status(200).json({ orders });
  }
);

routes.get(
  "/get-order/:orderId",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const orderId = req.params.orderId;
    if (typeof orderId !== "string")
      return res.status(400).json({ message: "orderId required" });
    const order = await (db as any).orders.findUnique({
      where: { id: orderId },
    });
    if (order && order.userId !== req.userId)
      return res.status(403).json({ message: "not authorized" });
    res.status(200).json({ order });
  }
);

routes.get(
  "/get-positions/:marketId",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const marketId = req.params.marketId;
    if (typeof marketId !== "string")
      return res.status(400).json({ message: "marketId required" });
    const positions = await (db as any).positions.findMany({
      where: { marketId, userId: req.userId, status: "OPEN" },
    });
    res.status(200).json({ positions });
  }
);

routes.get(
  "/get-fills/:marketId",
  authUserMiddleware,
  async (req: Request, res: Response) => {
    const marketId = req.params.marketId;
    if (typeof marketId !== "string")
      return res.status(400).json({ message: "marketId required" });
    const fills = await (db as any).fills.findMany({
      where: { marketId, userId: req.userId },
    });
    res.status(200).json({ fills });
  }
);

export default routes;
