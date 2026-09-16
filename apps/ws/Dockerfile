FROM oven/bun:1.1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/ws/package.json ./apps/ws/package.json
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .

RUN bun run --filter ws build
RUN ls -la apps/ws/dist/ && test -f apps/ws/dist/index.js

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/apps/ws/dist ./dist

EXPOSE 8080
CMD ["bun", "run", "dist/index.js"]
