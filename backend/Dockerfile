FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json  package-lock.json ./
COPY backend/package.json  ./backend/
COPY shared/package.json  ./shared/

RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --workspace=backend


COPY /backend ./backend
COPY /shared ./shared

RUN npm run build --workspace=backend


FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=256 --no-warnings" \
    NPM_CONFIG_LOGLEVEL=silent

# copy workspace manifests so npm can install at root
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# install production deps into /app/node_modules (root)
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev && \
    npm cache clean --force

# copy only built backend artifacts and package manifests (avoid including src)
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/public ./backend/public


USER nodejs
EXPOSE 8081

# ENTRYPOINT points at compiled backend entry; adjust if build emits a different path
ENTRYPOINT ["node", "backend/dist/backend/src/index.js"]