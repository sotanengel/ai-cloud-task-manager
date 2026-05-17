# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/mcp-server/package.json ./packages/mcp-server/
COPY packages/web/package.json ./packages/web/

RUN npm ci --ignore-scripts

# Copy source
COPY tsconfig.json ./
COPY schemas/ ./schemas/
COPY packages/ ./packages/

# Build TypeScript
RUN npm run build --workspace=packages/core
RUN npm run build --workspace=packages/adapters
RUN npm run build --workspace=packages/mcp-server

# Build WebUI
RUN npm run build --workspace=packages/web

# ---- Runtime stage ----
FROM node:20-slim AS runtime

WORKDIR /app

# Create non-root user
RUN groupadd --gid 1001 cloudpilot && \
    useradd --uid 1001 --gid cloudpilot --shell /bin/bash cloudpilot

# Copy built artifacts
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/adapters/dist ./packages/adapters/dist
COPY --from=builder /app/packages/adapters/package.json ./packages/adapters/
COPY --from=builder /app/packages/mcp-server/dist ./packages/mcp-server/dist
COPY --from=builder /app/packages/mcp-server/package.json ./packages/mcp-server/
COPY --from=builder /app/packages/web/dist ./packages/web/dist
COPY --from=builder /app/schemas ./schemas

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Data directory for SQLite
RUN mkdir -p /data && chown cloudpilot:cloudpilot /data

USER cloudpilot

EXPOSE 3000

ENV DATABASE_PATH=/data/cloudpilot.db
ENV PORT=3000
ENV LOG_LEVEL=info

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))"

CMD ["node", "packages/mcp-server/dist/index.js"]
