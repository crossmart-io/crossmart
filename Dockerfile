# One image definition for every app: docker build --build-arg APP=api|worker|mcp .
# The same images run in self-hosted docker compose and in Crossmart Cloud.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH HUSKY=0
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm db:generate && pnpm build

# Applies pending database migrations, then exits.
FROM deps AS migrate
COPY prisma.config.ts ./
COPY libs/database/prisma ./libs/database/prisma
CMD ["pnpm", "db:deploy"]

FROM base AS runtime
ARG APP=api
ENV NODE_ENV=production APP_ENTRY=dist/apps/${APP}/main.js
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && pnpm rebuild @prisma/engines prisma
# Lets the image apply migrations before it starts (`pnpm db:deploy`, Railway's pre-deploy step).
COPY prisma.config.ts ./
COPY libs/database/prisma ./libs/database/prisma
COPY --from=build /app/dist ./dist
USER node
CMD ["sh", "-c", "node $APP_ENTRY"]
