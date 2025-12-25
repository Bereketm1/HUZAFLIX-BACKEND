FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/audit-log-service/package.json ./apps/audit-log-service/
COPY apps/audit-log-service/tsconfig.json ./apps/audit-log-service/
COPY apps/audit-log-service/tsconfig.build.json ./apps/audit-log-service/
COPY apps/audit-log-service/nest-cli.json ./apps/audit-log-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/audit-log-service/src ./apps/audit-log-service/src

RUN pnpm --filter audit-log-service build

WORKDIR /app/apps/audit-log-service

EXPOSE 3000

CMD ["pnpm", "start:prod"]
