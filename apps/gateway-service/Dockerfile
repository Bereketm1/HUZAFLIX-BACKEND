FROM node:20
WORKDIR /app

RUN npm install -g pnpm && apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/gateway-service/package.json ./apps/gateway-service/
COPY apps/gateway-service/tsconfig.json ./apps/gateway-service/
COPY apps/gateway-service/tsconfig.build.json ./apps/gateway-service/
COPY apps/gateway-service/nest-cli.json ./apps/gateway-service/

RUN pnpm install --frozen-lockfile

COPY apps/gateway-service/src ./apps/gateway-service/src

RUN pnpm gateway build

WORKDIR /app/apps/gateway-service

EXPOSE ${APP_PORT:-3000}

CMD ["pnpm", "start:prod"]
