FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/audit-log-service/package.json ./apps/audit-log-service/
COPY apps/audit-log-service/tsconfig.json ./apps/audit-log-service/
COPY apps/audit-log-service/tsconfig.build.json ./apps/audit-log-service/
COPY apps/audit-log-service/nest-cli.json ./apps/audit-log-service/
COPY apps/audit-log-service/data-source.ts ./apps/audit-log-service/
COPY apps/audit-log-service/tsconfig.migrations.json ./apps/audit-log-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/audit-log-service/src ./apps/audit-log-service/src
COPY apps/audit-log-service/migrations ./apps/audit-log-service/migrations

RUN pnpm --filter audit-log-service build

WORKDIR /app/apps/audit-log-service

EXPOSE 3000

COPY apps/audit-log-service/wait-for-postgres.sh ./wait-for-postgres.sh
RUN chmod +x ./wait-for-postgres.sh && sed -i 's/\r$//' ./wait-for-postgres.sh || true

CMD ["sh", "./wait-for-postgres.sh", "pnpm", "start:prod"]
