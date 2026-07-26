# ─── Stage 1: Build & Dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies cleanly
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code and offline OCR traineddata
COPY . .

# ─── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for enhanced security
RUN addgroup -g 1001 -S pocketgroup && \
    adduser -u 1001 -S pocketuser -G pocketgroup && \
    mkdir -p /usr/src/app/uploads && \
    chown -R pocketuser:pocketgroup /usr/src/app

USER pocketuser

# Copy built artifacts and modules from builder stage
COPY --from=builder --chown=pocketuser:pocketgroup /usr/src/app ./

EXPOSE 5000

# Healthcheck against health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
