-- Plain-Postgres OHLC views from Fills (Neon has no TimescaleDB).
-- Same interface the backend expects: bucket, "marketId", open, high, low, close, "lastTradeId".
-- Always fresh (no refresh policy needed); fine for demo volume.
CREATE OR REPLACE VIEW candles_1min AS
SELECT
  date_trunc('minute', "createdAt") AS bucket,
  "marketId",
  (array_agg("price" ORDER BY "createdAt" ASC))[1] AS open,
  max("price") AS high,
  min("price") AS low,
  (array_agg("price" ORDER BY "createdAt" DESC))[1] AS close,
  (array_agg("id" ORDER BY "createdAt" DESC))[1] AS "lastTradeId"
FROM "Fills"
GROUP BY 1, 2;

CREATE OR REPLACE VIEW candles_1hour AS
SELECT
  date_trunc('hour', "createdAt") AS bucket,
  "marketId",
  (array_agg("price" ORDER BY "createdAt" ASC))[1] AS open,
  max("price") AS high,
  min("price") AS low,
  (array_agg("price" ORDER BY "createdAt" DESC))[1] AS close,
  (array_agg("id" ORDER BY "createdAt" DESC))[1] AS "lastTradeId"
FROM "Fills"
GROUP BY 1, 2;

CREATE OR REPLACE VIEW candles_1day AS
SELECT
  date_trunc('day', "createdAt") AS bucket,
  "marketId",
  (array_agg("price" ORDER BY "createdAt" ASC))[1] AS open,
  max("price") AS high,
  min("price") AS low,
  (array_agg("price" ORDER BY "createdAt" DESC))[1] AS close,
  (array_agg("id" ORDER BY "createdAt" DESC))[1] AS "lastTradeId"
FROM "Fills"
GROUP BY 1, 2;
