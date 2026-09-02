import { EngineServer } from "./classes/EngineServer.js";
import { OrderBook } from "./classes/OrderBook.js";
import { UserManager } from "./classes/UserManager.js";
import { RiskManager } from "./classes/RiskManager.js";
import { FillManager } from "./classes/FillManager.js";
import { PositionManager } from "./classes/PositionManager.js";
import { MatchingEngine } from "./classes/MatchingEngine.js";
import { RedisManager } from "./classes/RedisManager.js";
import { DBPoller } from "./classes/DBPollerManager.js";


const users = new Map();
const userIds: string[] = [];
const redisManager = new RedisManager();
const orderBook = new OrderBook();
const userManager = new UserManager(users, userIds);
const riskManager = new RiskManager(orderBook);
const fillManager = new FillManager();
const positionManager = new PositionManager(
  userManager,
  redisManager,
  riskManager
);

const matchingEngine = new MatchingEngine(
  orderBook,
  fillManager,
  positionManager,
  riskManager,
  redisManager,
  userManager,
);

const engineServer = new EngineServer(
  matchingEngine,
  userManager,
  riskManager,
  redisManager,
  orderBook
);


await redisManager.connect();
const dbPoller = new DBPoller(redisManager.getPublisherClient());
matchingEngine.setDBPoller(dbPoller);
positionManager.setDBPoller(dbPoller);
engineServer.setDBPoller(dbPoller);

void engineServer.start().catch((error) => {
  console.error("engine server stopped unexpecteldy", error);
});
