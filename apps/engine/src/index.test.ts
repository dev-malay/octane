import { describe, it, expect, beforeEach } from "vitest";
import { OrderBook } from "./classes/OrderBook";
import { FillManager } from "./classes/FillManager";
import { UserManager } from "./classes/UserManager";
import { RiskManager } from "./classes/RiskManager";
import { PositionManager } from "./classes/PositionManager";
import { MatchingEngine } from "./classes/MatchingEngine";
import { RedisManager } from "./classes/RedisManager";
import type { Order } from "shared-types";

function makeOrder(over: Partial<Order> & { orderId: string; userId: string; marketId: string }): Order {
  return { marketType: "LIMIT", positionType: "LONG", status: "OPEN", price: 100, qty: 10, leverage: 10, remainingQty: 10, orderType: "LIMIT", ...over } as Order;
}

describe("engine pure", () => {
  let ob: OrderBook; let fm: FillManager; let um: UserManager; let rm: RiskManager; let pm: PositionManager; let rdm: RedisManager; let me: MatchingEngine;
  beforeEach(async () => {
    ob = new OrderBook(); fm = new FillManager(); const users = new Map(); const ids: string[] = []; um = new UserManager(users, ids); await um.addUser("alice"); await um.addUser("bob"); rdm = new RedisManager(); rm = new RiskManager(ob); pm = new PositionManager(um, rdm, rm); me = new MatchingEngine(ob, fm, pm, rm, rdm, um);
  });
  it("limit buy no cross rests in book", () => {
    const o = makeOrder({ orderId: "1", userId: "alice", marketId: "BTCUSDT", positionType: "LONG", price: 90, qty: 5, remainingQty: 5 });
    const o2 = makeOrder({ orderId: "2", userId: "bob", marketId: "BTCUSDT", positionType: "SHORT", price: 110, qty: 5, remainingQty: 5 });
    ob.addToBook(o2);
    me.matchOrder(o);
    expect(o.remainingQty).toBe(5);
    expect(ob.getDepth("BTCUSDT").bids.length).toBe(1);
  });
  it("limit buy crosses ask -> filled", () => {
    const ask = makeOrder({ orderId: "ask1", userId: "bob", marketId: "BTCUSDT", positionType: "SHORT", price: 100, qty: 5, remainingQty: 5 });
    ob.addToBook(ask);
    const taker = makeOrder({ orderId: "take1", userId: "alice", marketId: "BTCUSDT", positionType: "LONG", price: 100, qty: 5, remainingQty: 5 });
    me.matchOrder(taker);
    expect(taker.remainingQty).toBe(0);
    expect(taker.status).toBe("FILLED");
    expect(fm.getFills().length).toBe(1);
  });
  it("market sweeps multiple levels VWAP", () => {
    ob.addToBook(makeOrder({ orderId: "a1", userId: "bob", marketId: "BTCUSDT", positionType: "SHORT", price: 100, qty: 3, remainingQty: 3 }));
    ob.addToBook(makeOrder({ orderId: "a2", userId: "bob", marketId: "BTCUSDT", positionType: "SHORT", price: 101, qty: 3, remainingQty: 3 }));
    const taker = makeOrder({ orderId: "m1", userId: "alice", marketId: "BTCUSDT", positionType: "LONG", marketType: "MARKET", price: undefined, qty: 5, remainingQty: 5 });
    me.matchOrder(taker);
    expect(taker.remainingQty).toBe(0);
    expect(fm.getFills().length).toBe(2);
  });
  it("partial fill", () => {
    ob.addToBook(makeOrder({ orderId: "a1", userId: "bob", marketId: "BTCUSDT", positionType: "SHORT", price: 100, qty: 3, remainingQty: 3 }));
    const taker = makeOrder({ orderId: "t1", userId: "alice", marketId: "BTCUSDT", positionType: "LONG", price: 100, qty: 10, remainingQty: 10 });
    me.matchOrder(taker);
    expect(taker.remainingQty).toBe(7);
    expect(taker.status).toBe("PARTIAL_FILLED");
  });
  it("cancel removes from book", () => {
    const o = makeOrder({ orderId: "c1", userId: "alice", marketId: "BTCUSDT", positionType: "LONG", price: 90, qty: 5, remainingQty: 5 });
    ob.addToBook(o);
    expect(ob.getDepth("BTCUSDT").bids.length).toBe(1);
    ob.cancelOrder(o);
    expect(ob.getDepth("BTCUSDT").bids.length).toBe(0);
  });
});
