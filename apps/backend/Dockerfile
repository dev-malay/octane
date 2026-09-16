FROM oven/bun:1.1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .

RUN bun run --filter @prisma-db generate && bun run --filter backend build
RUN ls -la apps/backend/dist/ && test -f apps/backend/dist/index.js

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/apps/backend/dist ./dist

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
