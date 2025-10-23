# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy all code
COPY apps ./apps
COPY libs ./libs

# Install dependencies
RUN npm install

# Generate ALL Prisma clients
RUN npx prisma generate --schema=apps/user/prisma/schema.prisma || true
RUN npx prisma generate --schema=apps/auth/prisma/schema.prisma || true
RUN npx prisma generate --schema=apps/notification/prisma/schema.prisma || true

# Build the target app
ARG APP_NAME
RUN echo "Building ${APP_NAME}..." && npm run build ${APP_NAME}

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ARG APP_NAME
ARG APP_PORT

ENV APP_NAME=${APP_NAME}
ENV PORT=${APP_PORT}

COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps ./apps

EXPOSE ${APP_PORT}

CMD ["sh", "-c", "echo Running app: ${APP_NAME} && node dist/apps/${APP_NAME}/main.js"]
