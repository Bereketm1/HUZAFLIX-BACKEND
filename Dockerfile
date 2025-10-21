# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:20-alpine
WORKDIR /app

# Copy package.json and install prod deps only
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
