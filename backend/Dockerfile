# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/prisma          ./prisma
COPY package*.json ./
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production
ENV PROTOTYPE_MODE=true
ENV AI_PROVIDER=none

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
