FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY be/package.json ./be/

RUN pnpm install --frozen-lockfile --filter @equinox/be...

COPY be/ ./be/

RUN pnpm --filter @equinox/be build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "be/dist/index.js"]
