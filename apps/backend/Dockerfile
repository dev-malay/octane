FROM oven/bun:1.1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun build src/index.ts --outdir dist --target bun

RUN ls -la dist/ && test -f dist/index.js

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]