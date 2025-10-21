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
# install netcat so we can wait for the database in the entrypoint script
RUN apk add --no-cache netcat-openbsd bash

# Copy built files from builder
COPY --from=builder /app/dist ./dist
# copy wait script
COPY wait-for-postgres.sh ./
RUN chmod +x ./wait-for-postgres.sh

EXPOSE 3000
CMD ["./wait-for-postgres.sh", "node", "dist/main"]
