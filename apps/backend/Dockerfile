# apps/backend/Dockerfile
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Verify build output exists
RUN ls -la dist/ && test -f dist/index.js

# Production
FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lock ./

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]