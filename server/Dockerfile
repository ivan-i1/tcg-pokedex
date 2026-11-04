# TCG Pokédex API. Build context is the repo root (see server/compose.yml).
# Node 24 runs the TypeScript sources directly (type stripping), so there is no build step
# and no dependencies.
FROM node:24-alpine
WORKDIR /app
COPY server/ ./server/
COPY src/core/coverage/coverage.ts ./src/core/coverage/coverage.ts
# Marks the sources as ES modules (the repo's own package.json is the Expo app's).
RUN printf '{"type":"module"}\n' > package.json
USER node
ENV PORT=18100 HOST=0.0.0.0
EXPOSE 18100
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:18100/health || exit 1
CMD ["node", "server/main.ts"]
