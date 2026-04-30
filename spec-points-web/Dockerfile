# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Write nginx config inline (avoids build-context path issues on Railway)
RUN printf 'server {\n\
    listen 8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_min_length 1024;\n\
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;\n\
\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
    add_header Cross-Origin-Opener-Policy "unsafe-none" always;\n\
\n\
    client_max_body_size 10M;\n\
\n\
    location ~* /logo-(192|512)\\.png$ {\n\
        expires -1;\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;\n\
    }\n\
\n\
    location = /favicon.ico {\n\
        access_log off;\n\
        log_not_found off;\n\
        return 204;\n\
    }\n\
\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|webp|ico|svg|woff|woff2|ttf|eot|map)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    location = /sw.js {\n\
        add_header Cache-Control "no-cache";\n\
        proxy_cache_bypass $http_pragma;\n\
        proxy_cache_revalidate on;\n\
        expires off;\n\
        access_log off;\n\
    }\n\
\n\
    location = /manifest.json {\n\
        add_header Cache-Control "no-cache";\n\
    }\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /health {\n\
        access_log off;\n\
        return 200 "OK\\n";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Expose port (Railway public networking is configured to 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
