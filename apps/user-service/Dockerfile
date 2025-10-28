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
# Copy package.json (kept for metadata)
COPY package*.json ./
# Copy node_modules from the builder stage to avoid re-installing during final image build
COPY --from=builder /app/node_modules ./node_modules
# install netcat so we can wait for the database in the entrypoint script
RUN apk add --no-cache netcat-openbsd

# Copy the entire built app from the builder stage (includes dist and other generated files)
COPY --from=builder /app /app
# copy wait script
COPY wait-for-postgres.sh ./
RUN chmod +x ./wait-for-postgres.sh
RUN sed -i 's/\r$//' ./wait-for-postgres.sh || true

EXPOSE 3000
CMD ["sh", "./wait-for-postgres.sh", "node", "dist/src/main.js"]
