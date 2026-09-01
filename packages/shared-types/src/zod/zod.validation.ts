import z from "zod";

export const userSchemaValidation = z.object({
  email: z.email(),
  password: z.string(),
  role: z.enum(["admin", "user"])
});

export const CreateOrderSchema = z.object({
  marketId: z.string(),
  price: z.number(),
  qty: z.number().positive(),
  leverage: z.number().min(1).max(100),
  orderType: z.enum(["MARKET", "LIMIT"]),
  positionType: z.enum(["LONG", "SHORT"])
});

export const getOrderSchema = z.object({ orderId: z.string() });
export const getFillsSchema = z.object({ marketId: z.string() });
export const cancelOrdersSchema = z.object({
  marketId: z.string(),
  price: z.number(),
  positionType: z.enum(["LONG", "SHORT"]),
  qty: z.number().positive().optional().default(0),
  leverage: z.number().min(1).max(100).optional().default(1),
  orderType: z.enum(["MARKET", "LIMIT"]).optional().default("LIMIT")
});


export const createMarketSchema = z.object({
  marketId: z.string(),
  marketName: z.string(),
  symbol: z.string().optional().default(""),
  maxLeverage: z.number().max(100),
});

export const addBalanceSchema = z.object({ amount: z.number().positive()});
