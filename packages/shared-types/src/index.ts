import { LinkList, OrderedMap } from "js-sdsl"

export type positionType = 'LONG' | 'SHORT'
export type marketType = 'MARKET' | 'LIMIT'
export type orderStatus = 'OPEN' | 'FILLED' | 'PARTIAL_FILLED' | 'CANCEL'
export type dbPollerEvent = 'OrderUpdate' | 'TradeExecuted' | 'FillsCreated' | 'PositionUpdated' | 'BalanceUpdated' | 'MarketCreated'

export type UserPositions = {
  marketId: string;
  positionType: positionType;
  qty: number;
  leverage: number;
  margin: number;
  maintainanceMargin: number;
  liquidationPrice: number;
  pnL: number;
  realisedPnL: number;
  entryPrice:number;
  averagePrice: number;
  unrealisedPnL: number;
};

export type UserOrders = {
  orderId: string;
  marketId: string;
  positionType: positionType;
  qty: number;
  margin: number;
  leverage: number;
  orderType: string;
  price: number;
  filledQty: number;
  remainingQty: number;
  status: string;
};

export type User = {
  userId: string;
  collateral: {
    availabe: number;
    locked: number;
  };
  positions: UserPositions[];
  orders: UserOrders[];
};

export interface Order {
    orderId: string,
    userId: string,
    marketId: string,
    marketType: marketType,
    orderType: string,
    positionType: positionType,
    status: orderStatus,
    price? : number,
    qty: number,
    leverage: number,
    remainingQty: number
}

export interface SingleOrderBook {
    asks: OrderedMap<number, LinkList<Order>>;
    bids: OrderedMap<number, LinkList<Order>>;
    lastTradedPrice: number,
    indexPrice: number
}

export interface OrderBooks {
    [marketId: string]: SingleOrderBook
}

export interface Fills {
    maker : string,
    taker: string, 
    makerOrderId: string,
    takerOrderId: string,
    marketId: string,
    qty: number,
    price: number
}

export interface CustomPosition {
  userId: string,
  position: UserPositions
}

export interface CustomBalance {
  userId: string;
  availableBalance: number;
  lockedBalance: number;
}

export interface CreateMarket {
  marketId: string,
  marketName: string,
  symbol: string,
  maxLeverage: string
}

export interface dbPollerEvents {
  type: dbPollerEvent,
  payload: dbPollerPayload
}

export interface dbPollerPayload {
  method: "POST" | "PUT" | "DELETE",
  data: Order | CustomPosition | Fills | CustomBalance | CreateMarket
}

export {
  userSchemaValidation,
  CreateOrderSchema,
  getOrderSchema,
  getFillsSchema,
  cancelOrdersSchema,
  createMarketSchema,
  addBalanceSchema
} from "./zod/zod.validation"



export type { WsRequests, EngineCommands, EngineEvents, depthUpdates, tradeUpdates, positionUpdates, tickerUpdates, orderUpdates } from "./ws/ws.types"