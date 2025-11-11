FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/api-mgmt-service/package.json ./apps/api-mgmt-service/
COPY apps/api-mgmt-service/tsconfig.json ./apps/api-mgmt-service/
COPY apps/api-mgmt-service/tsconfig.build.json ./apps/api-mgmt-service/
COPY apps/api-mgmt-service/tsconfig.migrations.json ./apps/api-mgmt-service/
COPY apps/api-mgmt-service/nest-cli.json ./apps/api-mgmt-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/api-mgmt-service/src ./apps/api-mgmt-service/src

RUN pnpm api-mgmt build

COPY apps/api-mgmt-service/wait-for-postgres.sh ./apps/api-mgmt-service/wait-for-postgres.sh
RUN chmod +x ./apps/api-mgmt-service/wait-for-postgres.sh && sed -i 's/\r$//' ./apps/api-mgmt-service/wait-for-postgres.sh || true

WORKDIR /app/apps/api-mgmt-service

EXPOSE ${APP_PORT:-3000}

CMD ["sh", "./wait-for-postgres.sh", "pnpm", "start:prod"]
