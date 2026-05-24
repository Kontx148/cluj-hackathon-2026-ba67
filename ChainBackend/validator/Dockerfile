# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY data ./data
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Per-validator chain JSON lives under /data; mount a named volume for it.
RUN mkdir -p /data
VOLUME ["/data"]

# Default port; gets overridden via env at runtime
EXPOSE 4101
CMD ["node", "dist/index.js"]
