FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache nginx supervisor logrotate \
  && mkdir -p /run/nginx /var/log/nginx /var/lib/nginx/tmp /var/log/supervisor \
  && chown -R nginx:nginx /var/log/nginx /var/lib/nginx

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/conf.d /etc/nginx/conf.d
COPY deploy/nginx/snippets /etc/nginx/snippets
COPY deploy/supervisor/ptr-frontend.conf /etc/supervisor/conf.d/ptr-frontend.conf
COPY deploy/logrotate/ptr-nginx /etc/logrotate.d/ptr-nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1/nginx-health || exit 1

STOPSIGNAL SIGQUIT

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/ptr-frontend.conf"]
