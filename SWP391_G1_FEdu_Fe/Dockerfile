# ==========================================
# Stage 1: Build static assets
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Cache npm dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy code and build
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve using Nginx (Unprivileged)
# ==========================================
FROM nginxinc/nginx-unprivileged:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
