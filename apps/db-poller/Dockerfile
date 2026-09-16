# apps/db-poller/Dockerfile
FROM oven/bun:1.1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/db-poller/package.json ./apps/db-poller/package.json
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .

RUN bun run --filter db-poller build
RUN ls -la apps/db-poller/dist/ && test -f apps/db-poller/dist/index.js

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/apps/db-poller/dist ./dist

CMD ["bun", "run", "dist/index.js"]
