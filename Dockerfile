# =========================
# Stage 1: Build React
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_APP_NAME
ARG VITE_APP_URL
ARG VITE_BASE_PATH
ARG VITE_BACKEND_URL
ARG VITE_USE_MOCK

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK

RUN npm run build


# =========================
# Stage 2: Nginx
# =========================
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Vite outDir is `out` (see vite.config.ts) — not the default `dist`
COPY --from=builder /app/out /usr/share/nginx/html

# Host EC2 nginx proxies :80 → 127.0.0.1:3000 (compose should map 3000:80).
# This nginx.conf is ONLY for the container (SPA try_files). It does not replace host nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]