FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/payment-service/package.json ./apps/payment-service/
COPY apps/payment-service/tsconfig.json ./apps/payment-service/
COPY apps/payment-service/tsconfig.build.json ./apps/payment-service/
COPY apps/payment-service/tsconfig.migrations.json ./apps/payment-service/
COPY apps/payment-service/nest-cli.json ./apps/payment-service/
COPY apps/payment-service/data-source.ts ./apps/payment-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/payment-service/src ./apps/payment-service/src
COPY apps/payment-service/migrations ./apps/payment-service/migrations

RUN pnpm payment build

COPY apps/payment-service/wait-for-postgres.sh ./apps/payment-service/wait-for-postgres.sh
RUN chmod +x ./apps/payment-service/wait-for-postgres.sh && sed -i 's/\r$//' ./apps/payment-service/wait-for-postgres.sh || true

WORKDIR /app/apps/payment-service

EXPOSE ${APP_PORT:-3000}

CMD ["sh", "./wait-for-postgres.sh", "pnpm", "start:prod"]
