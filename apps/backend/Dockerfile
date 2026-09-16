FROM oven/bun:1.1 AS builder
WORKDIR /app


COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


COPY . .
RUN bun run build


RUN ls -la dist/ && test -f dist/index.js

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production


COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]