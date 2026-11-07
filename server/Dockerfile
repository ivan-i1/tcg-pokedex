# TCG Pokédex: API + web app in one image. Build context is the repo root (see server/compose.yml).

# Stage 1: export the Expo web app. EXPO_PUBLIC_API_URL="/" makes it call the API on the
# same origin that serves it, so no host name is baked in.
FROM node:24-bookworm-slim AS web
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app.json babel.config.js metro.config.js tsconfig.json ./
COPY plugins ./plugins
COPY assets ./assets
COPY public ./public
COPY src ./src
ENV EXPO_PUBLIC_API_URL=/ CI=1
RUN npx expo export --platform web --output-dir /web

# Stage 2: the runtime. Node 24 runs the TypeScript sources directly (type stripping),
# so there is no build step and no dependencies.
FROM node:24-alpine
WORKDIR /app
COPY server/ ./server/
COPY src/core/coverage/coverage.ts ./src/core/coverage/coverage.ts
COPY --from=web /web ./web
# Marks the sources as ES modules (the repo's own package.json is the Expo app's).
RUN printf '{"type":"module"}\n' > package.json
USER node
ENV PORT=18100 HOST=0.0.0.0 WEB_DIR=/app/web
EXPOSE 18100
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:18100/health || exit 1
CMD ["node", "server/main.ts"]
