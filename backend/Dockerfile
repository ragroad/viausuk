# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

# Install OpenSSL — required by Prisma on Alpine
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client for the correct Alpine targets
RUN npx prisma generate

RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM node:20-alpine AS runner

# Install OpenSSL runtime — required by Prisma query engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/prisma          ./prisma
COPY package*.json ./

ENV NODE_ENV=production

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
