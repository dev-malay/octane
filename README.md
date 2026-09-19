```
 ██████╗  ██████╗████████╗ █████╗ ███╗   ██╗███████╗
██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝
██║   ██║██║        ██║   ███████║██╔██╗ ██║█████╗
██║   ██║██║        ██║   ██╔══██║██║╚██╗██║██╔══╝
╚██████╔╝╚██████╗   ██║   ██║  ██║██║ ╚████║███████╗
 ╚═════╝  ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
```

A perpetuals trading platform built with Bun, TypeScript, Express, and Redis Streams. Uses an in-memory matching engine for order execution, Binance WebSocket feeds for index prices, PostgreSQL for persistence, and includes a React trading terminal with real-time updates, candlestick charts, and a built-in market simulator.

**Live:** Frontend · API (`/api/v1`) · WebSocket

---

## Architecture

```mermaid
flowchart LR
    subgraph Frontend
        UI["React + Vite + Tailwind"]
    end

    subgraph Backend
        API["Express API<br/>:3000"]
        MW["Middleware<br/>Auth (JWT) · CORS · Logger"]
        Handler["Route Handlers"]
    end

    subgraph Engine
        ENG["Matching Engine<br/>(in-memory order books)"]
        RISK["Risk + Liquidation<br/>Margin · Maintenance 5%"]
    end

    subgraph Gateway
        WS["WS Gateway<br/>:8080"]
    end

    subgraph Feeds
        BIN["Binance WS Bridge<br/>Trades → mark prices"]
    end

    subgraph Storage
        PG[("PostgreSQL<br/>users · orders · fills<br/>positions · balances")]
        RQ[("Redis<br/>Streams + Pub/Sub")]
    end

    subgraph Persistence
        POLL["DB Poller<br/>(stream → SQL)"]
    end

    UI -->|HTTP| API
    MW --> API
    API --> Handler
    Handler -->|XADD send-to-engine| RQ
    RQ -->|XREAD| ENG
    ENG -->|match| RISK
    ENG -->|XADD send-to-dbpoller| RQ
    RQ -->|XREAD| POLL
    POLL -->|write| PG
    Handler -->|read| PG
    BIN -->|publish mark prices| RQ
    RQ -->|subscribe| WS
    ENG -->|publish depth/trade/order/position/ticker| RQ
    WS -->|fan-out| UI
```

---

## Features

### Core Matching Engine
- **In-Memory Order Books** — `MatchingEngine` keeps one `OrderedMap<price, FIFO queue>` per market. `LONG` sweeps `asks` from the lowest price, `SHORT` sweeps `bids` from the highest price.
- **LIMIT + MARKET Orders** — `LIMIT` rests on the book when it stops crossing. `MARKET` ignores price, sweeps multiple levels, and stores the VWAP execution price on the order.
- **Redis Streams Plumbing** — The API never touches the engine directly. Orders flow `backend → send-to-engine → engine → send-to-dbpoller → db-poller → Postgres`, so a crash never loses an accepted order.
- **Accept-Then-Match** — `POST /order/create-order` mints an `orderId` and returns `order Accepted` immediately; matching happens asynchronously in the engine.
- **Risk Checks** — `margin = (price × qty) / leverage` must fit the available balance before an order is locked. Insufficient margin is rejected before matching.

### Liquidation
A background manager consumes live index prices and recomputes `unrealisedPnL` per position. `LONG` liquidates when `index ≤ entry × (1 − 1/lev + 0.05)`, `SHORT` when `index ≥ entry × (1 + 1/lev − 0.05)` (5% maintenance margin). Liquidations close via `MARKET` orders on the opposite side.

### Live Market Data
- **Binance WS Bridge** — Streams `btcusdt/ethusdt/solusdt@trade` from Binance, republishes mark prices to Redis every 3s (only on price change). Stays idle until at least one WS client is connected (demand-gated via `binance:wanted`).
- **WS Gateway** — Fan-out server on `:8080`. Clients `SUBSCRIBE` to `depth | trade | position | ticker | order` per market (plus `userId` for personal channels) and get snapshot replay plus live events.
- **Candle Views** — Postgres views (`candles_1min`, `candles_1hour`, `candles_1day`) aggregate `fills` into OHLC buckets served by `GET /order/get-candles/:marketId`.

### Frontend (React)
- Hyperliquid-inspired dark trading terminal with real-time auto-refresh via WebSocket (50ms UI batcher)
- Order form with long/short, `MARKET`/`LIMIT`, `ISOLATED`/`CROSS`, leverage presets, and testnet USD faucet (`+100 / +1K / +10K`)
- Live order book (11 levels), market trades tape, and canvas candlestick chart (`1m / 5m / 15m / 1h / 4h / 1d`)
- Positions, open orders (with cancel), fill history, and balances panel
- One-click demo accounts (`demo_alice`, `demo_bob`) plus username/password auth
- Built-in market simulator (configurable bots that stream resting bids/asks) and `/loadtest` page
- Persistent session across page refresh (localStorage token)

### API
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Create a user (seeded with 1,000,000 test USD) |
| `POST` | `/api/v1/auth/signin` | Sign in, returns JWT (7d, role-based) |
| `GET` | `/api/v1/auth/balance` | Get available + locked balance |
| `POST` | `/api/v1/auth/add-balance` | Faucet: top up test USD |
| `POST` | `/api/v1/order/create-order` | Accept and enqueue an order |
| `POST` | `/api/v1/order/cancel-order/:orderId` | Cancel an open order |
| `POST` | `/api/v1/order/create-market` | Create a market (admin only) |
| `GET` | `/api/v1/order/get-markets` | List markets |
| `GET` | `/api/v1/order/get-orders/:marketId` | List my orders on a market |
| `GET` | `/api/v1/order/get-order/:orderId` | Get a single order |
| `GET` | `/api/v1/order/get-positions/:marketId` | List my open positions |
| `GET` | `/api/v1/order/get-fills/:marketId` | List my fills |
| `GET` | `/api/v1/order/get-candles/:marketId` | OHLC candles (`timeframe=1min\|1hour\|1day`, `limit≤500`) |
| `GET` | `/api/v1/order/get-market-fills/:marketId` | Public trade tape (`limit≤2000`) |
| `GET` | `/health` | Health check |

---

## Getting Started

### Prerequisites
- Bun 1.3+
- PostgreSQL 16+ (or Docker)
- Redis 7+ (or Docker)

### Setup

```bash
# Install dependencies
bun install

# Configure environment (root .env)
# Edit .env with your database and Redis connection strings
```

Required root `.env` variables:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/perp
REDIS_URL=redis://localhost:6379
USER_JWT_SECRET=<random-hex>
ADMIN_JWT_SECRET=<random-hex>
```

Or run the full stack with Docker:

```bash
docker compose up --build
```

This starts TimescaleDB Postgres, Redis, backend `:3000`, engine, WS gateway `:8080`, db-poller, binance-ws bridge, and the frontend.

### Start the Backend

```bash
bun --filter backend dev
```

Starts the Express server on `:3000` with auth/order routes and the `/health` endpoint. Orders are forwarded to the engine over the `send-to-engine` Redis Stream.

### Start the Engine, WS Gateway & Workers

```bash
bun --filter engine dev
bun --filter ws dev
bun --filter db-poller dev
bun --filter binance-ws dev
```

The engine consumes `send-to-engine`, matches in memory, publishes market events, and forwards persistence events to `send-to-dbpoller` for the db-poller to write into Postgres.

### Start the Frontend

```bash
bun --filter frontend dev
```

Opens the React trading terminal at `http://localhost:5173`.

Frontend `.env` variables (`apps/frontend/.env`):
```
VITE_API_URL=/api/v1
VITE_WS_URL=ws://localhost:8080
```

Local Vite proxies `/api/v1` → `http://localhost:3000` and `/ws` → `ws://localhost:8080`, so no CORS setup is needed in dev.

---

## Project Structure

```
octane/
├── apps/
│   ├── backend/                # Express API :3000, JWT auth, order routes
│   │   └── src/
│   │       ├── index.ts        # CORS, /health, /api/v1 mounts
│   │       ├── routes/auth.ts  # signup, signin, balance, add-balance
│   │       ├── routes/orders.ts# create/cancel order, markets, positions, fills, candles
│   │       └── middleware/auth.ts # user + admin JWT middleware
│   ├── engine/                 # In-memory matching engine (Redis Stream consumer)
│   │   └── src/
│   │       ├── index.ts        # UserManager → Risk → Fill → Position → Matching
│   │       └── classes/
│   │           ├── EngineServer.ts     # Stream dispatch + checkpoints
│   │           ├── MatchingEngine.ts   # Core match loop + VWAP
│   │           ├── OrderBook.ts        # OrderedMap price levels, FIFO queues
│   │           ├── RiskManager.ts      # Margin + liquidation prices
│   │           ├── PositionManager.ts  # Avg price, PnL, flips
│   │           ├── LiquidationManager.ts # Index-price liquidator
│   │           ├── FillManager.ts      # Append-only fills list
│   │           └── RedisManager.ts     # Stream/sub/pub connections + snapshots
│   ├── ws/                     # WebSocket fan-out gateway :8080
│   │   └── src/
│   │       ├── index.ts            # HTTP + WS boot, /health
│   │       ├── WebSocketManager.ts # SUBSCRIBE / UNSUBSCRIBE protocol
│   │       ├── SubscriptionManager.ts # socket ↔ channel map
│   │       └── RedisSubscriber.ts  # Lazy subscribe + snapshot replay
│   ├── binance-ws/             # Binance trade stream → Redis mark-price bridge
│   │   └── src/index.ts        # btc/eth/sol@trade, 3s publish, demand-gated
│   ├── db-poller/              # send-to-dbpoller stream → Postgres writer
│   │   └── src/
│   │       ├── index.ts        # Blocking XREAD loop + checkpoint
│   │       └── AppendData.ts   # fills / order / position / balance / market writers
│   └── frontend/
│       └── src/
│           ├── App.tsx         # Trading layout, no router
│           ├── components/     # TopNav, MarketHeader, PriceChart, OrderBook, OrderForm, BottomPanel, AuthModal, Ticker, MarketSimulatorPanel, LoadTestPanel, ServerGate
│           ├── context/        # TradingContext (auth, sockets, sync, REST reconcile)
│           └── lib/            # api, ws/client, sync (orderbook/trades/candles/personal), simulation, loadTest, mappers, markets
├── packages/
│   ├── prisma-db/              # Prisma schema + migrations + client singleton
│   │   └── prisma/schema.prisma# User, Orders, Fills, Positions, UserBalance, Markets
│   ├── shared-types/           # Order/User/WS/zod validation types
│   ├── redis-client/           # Redis singleton + snapshot/binance constants
│   ├── ui/                     # Shared React stub library
│   ├── eslint-config/          # Shared eslint configs
│   └── typescript-config/      # Shared tsconfigs
├── docker-compose.yml          # Postgres + Redis + all services (local)
├── render.yaml                 # perp-api + perp-ws + Redis (production)
└── turbo.json                  # build/dev/lint/check-types pipelines
```

---

## API Documentation

### `POST /api/v1/auth/signup`

Creates a user with `1,000,000` test USD and returns a 7-day JWT. Any `username` becomes `<username>@perp.local` on the client.

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "trader@perp.local", "password": "secret123"}'
```

**Response (200 — New user)**
```json
{
  "message": "user created",
  "token": "<jwt>",
  "userId": "7f3a2c1e-85b4-4e3f-a631-f542289c4b7b"
}
```

**Response (200 — Existing user)**
```json
{
  "message": "user already exists"
}
```

### `POST /api/v1/auth/signin`

```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "trader@perp.local", "password": "secret123"}'
```

**Response (200)**
```json
{
  "message": "user singed in",
  "token": "<jwt>",
  "userId": "7f3a2c1e-85b4-4e3f-a631-f542289c4b7b"
}
```

### `POST /api/v1/auth/add-balance`

Faucet: tops up test USD (auth required).

```bash
curl -X POST http://localhost:3000/api/v1/auth/add-balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"amount": 10000}'
```

### `POST /api/v1/order/create-order`

Accepts and enqueues an order (auth required). `positionType` is `LONG`/`SHORT`, `orderType` is `LIMIT`/`MARKET`, `leverage` is `1–100`.

```bash
curl -X POST http://localhost:3000/api/v1/order/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"marketId": "SOLUSDT", "price": 150, "qty": 2, "leverage": 10, "orderType": "LIMIT", "positionType": "LONG"}'
```

**Response (200 — Accepted)**
```json
{
  "order": "Accepted",
  "orderId": "2d1b827e-85b4-4e3f-a631-f542289c4b7b",
  "queueId": "1725-0"
}
```

### `POST /api/v1/order/cancel-order/:orderId`

```bash
curl -X POST http://localhost:3000/api/v1/order/cancel-order/2d1b827e-85b4-4e3f-a631-f542289c4b7b \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"marketId": "SOLUSDT", "price": 150, "positionType": "LONG"}'
```

### `GET /api/v1/order/get-candles/:marketId`

OHLC candles from Postgres views. `timeframe` is one of `1min | 1hour | 1day` (default `1min`), `limit` up to `500` (default `90`).

```bash
curl "http://localhost:3000/api/v1/order/get-candles/SOLUSDT?timeframe=1min&limit=90"
```

### `GET /api/v1/order/get-market-fills/:marketId`

Public trade tape, newest first (`limit` up to `2000`, default `500`).

```bash
curl "http://localhost:3000/api/v1/order/get-market-fills/SOLUSDT?limit=500"
```

### `GET /health`

```bash
curl http://localhost:3000/health
```

---

## WebSocket Channels

Connect to the gateway (`ws://localhost:8080` locally) and subscribe per market. Personal channels also require `userId`.

| Channel | Subscribe message | Payload | Description |
|---|---|---|---|
| `depth` | `{"type":"SUBSCRIBE","channel":"depth","market":"SOLUSDT"}` | `{type: "depth", market, asks: [[price, qty]], bids: [[price, qty]]}` | Full 10-level book + snapshot replay on subscribe |
| `trade` | `{"type":"SUBSCRIBE","channel":"trade","market":"SOLUSDT"}` | `{type: "trades", marketId, price, qty, maker, taker, timestamp}` | Live execution tape |
| `ticker` | `{"type":"SUBSCRIBE","channel":"ticker","market":"SOLUSDT"}` | `{type: "ticker", marketId, indexPrice, markPrice}` | Index/mark price updates |
| `order` | `{"type":"SUBSCRIBE","channel":"order","market":"SOLUSDT","userId":"<uuid>"}` | `{type: "orderCreate \| orderUpdate", orderId, marketId, price, qty, remainingQty, leverage, status}` | Personal order events |
| `position` | `{"type":"SUBSCRIBE","channel":"position","market":"SOLUSDT","userId":"<uuid>"}` | `{type: "position", marketId}` | Personal position notifies (detail refetched over REST) |

Unsubscribe with `{"type":"UNSUBSCRIBE","channel":"...","market":"...","userId":"..."}`. The gateway replies `SUBSCRIBED` / `UNSUBSCRIBED` / `ERROR`.

---

## Order & Position Lifecycle

```
OPEN → PARTIALLY_FILLED → FILLED
OPEN → CANCEL (user cancel)
OPEN → CANCEL (liquidated leg re-opened as MARKET on opposite side)

Positions: OPEN → CLOSE (full close deletes the leg, partial close credits PnL)
```

- **OPEN** — Order accepted, resting on the book (or fully filled by a later match)
- **PARTIALLY_FILLED** — Part of the quantity matched, remainder still on the book
- **FILLED** — Quantity fully matched
- **CANCEL** — Cancelled by the user; locked margin is refunded
- **REJECTED** — Rejected at write time (persisted only)

---

## License

MIT
