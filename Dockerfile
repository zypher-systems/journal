# ── build stage ──────────────────────────────────────────────
# Runs on the builder's own platform: its output is plain JS, so a multi-arch
# build only emulates the runtime stage's npm ci.
FROM --platform=$BUILDPLATFORM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── runtime stage ─────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app

LABEL org.opencontainers.image.title="journal" \
	org.opencontainers.image.description="A private, multi-user journal you host yourself." \
	org.opencontainers.image.source="https://github.com/zypher-systems/journal" \
	org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
ENV UPLOADS_DIR=/data/uploads

# Unprivileged user
RUN groupadd --system --gid 1001 app \
	&& useradd --system --uid 1001 --gid app --home /app app

# Production dependencies (resolved by both build/index.js and scripts/)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# App output + startup assets
COPY --from=build /app/build ./build
COPY migrations ./migrations
COPY scripts ./scripts
COPY src/lib/data/prompts.json ./src/lib/data/prompts.json

RUN mkdir -p /data/uploads && chown -R app:app /app /data
USER app

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["sh", "-c", "node scripts/migrate.mjs && exec node build/index.js"]
