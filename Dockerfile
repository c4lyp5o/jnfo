# ============================
# Stage 1: Builder
# ============================
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# Install backend deps
COPY package*.json ./
RUN bun install

# Copy client and build it
COPY client ./client
RUN cd client && bun install && bun run build


# ============================
# Stage 2: Production
# ============================
FROM oven/bun:1.3-alpine

WORKDIR /app

# Install system deps
RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Kuala_Lumpur

# Only install production deps for backend
COPY package*.json ./
RUN bun install --production

# Copy backend
COPY src ./src
COPY .env ./

# Copy built client bundle
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# If you use PM2 ecosystem
CMD ["bun", "start"]