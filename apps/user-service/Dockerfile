FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd postgresql-client && rm -rf /var/lib/apt/lists/*

# Harden pnpm installs against transient registry/network issues in container builds.
ENV PNPM_FETCH_RETRIES=5 \
	PNPM_FETCH_RETRY_MINTIMEOUT=10000 \
	PNPM_FETCH_RETRY_MAXTIMEOUT=120000 \
	PNPM_FETCH_TIMEOUT=600000 \
	PNPM_NETWORK_CONCURRENCY=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/user-service/package.json ./apps/user-service/
COPY apps/user-service/tsconfig.json ./apps/user-service/
COPY apps/user-service/tsconfig.build.json ./apps/user-service/
COPY apps/user-service/nest-cli.json ./apps/user-service/
COPY apps/user-service/data-source.ts ./apps/user-service/
COPY apps/user-service/tsconfig.migrations.json ./apps/user-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/user-service/src ./apps/user-service/src
COPY apps/user-service/migrations ./apps/user-service/migrations
COPY apps/user-service/seeds ./apps/user-service/seeds

RUN pnpm user build

COPY apps/user-service/wait-for-postgres.sh ./apps/user-service/wait-for-postgres.sh
RUN chmod +x ./apps/user-service/wait-for-postgres.sh && sed -i 's/\r$//' ./apps/user-service/wait-for-postgres.sh || true

WORKDIR /app/apps/user-service

EXPOSE ${APP_PORT:-3000}

CMD ["sh", "./wait-for-postgres.sh", "pnpm", "start:prod"]
