# Build Application
ARG NODE_VERSION=24.12.0-alpine
ARG NGINX_VERSION=alpine3.22

FROM node:${NODE_VERSION} AS builder

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_XRAY_ENABLED
ENV VITE_XRAY_ENABLED=${VITE_XRAY_ENABLED}

WORKDIR /app

# Copy root package files first
COPY package.json package-lock.json ./
COPY frontend/package.json  ./frontend/
COPY shared/package.json  ./shared/

# Install dependencies using cache mount
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --workspace=frontend

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

RUN npm run build --workspace=frontend


# =========================================
# Stage 2: Production
# =========================================

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS production

WORKDIR /app

COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY  --chown=nginx:nginx --from=builder /app/frontend/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf","-g", "daemon off;"]
