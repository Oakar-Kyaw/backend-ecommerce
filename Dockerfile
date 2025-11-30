# Stage 1 — Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY apps apps
COPY libs libs

RUN npm ci

ARG APP_NAME
RUN npx prisma generate --schema=apps/${APP_NAME}/prisma/schema.prisma

RUN npm run build ${APP_NAME}

# Stage 2 — Production
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

ARG APP_NAME
ARG APP_PORT
ENV PORT=${APP_PORT}

EXPOSE ${APP_PORT}

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
