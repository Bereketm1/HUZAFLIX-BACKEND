FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

COPY apps/analytics-service/package.json ./apps/analytics-service/
COPY apps/analytics-service/tsconfig.json ./apps/analytics-service/
COPY apps/analytics-service/tsconfig.build.json ./apps/analytics-service/
COPY apps/analytics-service/nest-cli.json ./apps/analytics-service/

RUN pnpm install --frozen-lockfile

RUN pnpm common build

COPY apps/analytics-service/src ./apps/analytics-service/src

RUN pnpm analytics build

WORKDIR /app/apps/analytics-service

EXPOSE ${APP_PORT:-3000}

CMD ["pnpm", "start:prod"]
