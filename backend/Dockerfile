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

COPY package.json  package-lock.json ./
COPY backend/package.json  ./backend/
COPY shared/package.json  ./shared/

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --workspace=backend --omit=dev && \
    npm cache clean --force


COPY --from=builder --chown=nodejs:nodejs /app/backend/dist ./dist

USER nodejs
EXPOSE 8081

CMD ["node", "dist/backend/src/index.js"]