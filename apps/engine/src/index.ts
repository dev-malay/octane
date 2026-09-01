import { OrderBook } from "./classes/OrderBook";
import { UserManager } from "./classes/UserManager";
import { RiskManager } from "./classes/RiskManager";
import { FillManager } from "./classes/FillManager";
import { PositionManager } from "./classes/PositionManager";
import { MatchingEngine } from "./classes/MatchingEngine";
import { RedisManager } from "./classes/RedisManager";


const users = new Map();

const userIds: string[] = [];


const redisManager = new RedisManager();
const orderBook = new OrderBook();
const userManager = new UserManager(users, userIds);
const riskManager = new RiskManager(orderBook);
const fillManager = new FillManager();
const positionManager = new PositionManager(userManager, redisManager, riskManager);
const matchingEngine = new MatchingEngine(orderBook, fillManager, positionManager, riskManager, redisManager, userManager);
export { orderBook, matchingEngine, userManager, riskManager, positionManager, fillManager, redisManager };


console.log("engineready")
