# Root Dockerfile — used when Railway builds from repo root (default service = backend)
# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .

RUN npx prisma generate
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

COPY --from=builder /app/dist            ./dist
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/prisma          ./prisma
COPY backend/package*.json ./
COPY backend/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production
ENV PROTOTYPE_MODE=true
ENV AI_PROVIDER=none

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
