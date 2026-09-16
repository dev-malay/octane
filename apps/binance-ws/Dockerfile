# apps/binance-ws/Dockerfile
FROM oven/bun:1.1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/binance-ws/package.json ./apps/binance-ws/package.json
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .

RUN bun run --filter binance-ws build
RUN ls -la apps/binance-ws/dist/ && test -f apps/binance-ws/dist/index.js

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/apps/binance-ws/dist ./dist

CMD ["bun", "run", "dist/index.js"]
