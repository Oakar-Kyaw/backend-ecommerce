# Stage 1 — Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy project metadata
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY apps apps
COPY libs libs

# Upgrade npm to match lockfile
RUN npm install -g npm@11.6.4

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Build arguments for service name
ARG APP_NAME

# Generate Prisma client for this service only
RUN npx prisma generate --schema=apps/${APP_NAME}/prisma/schema.prisma

# Build the NestJS service
RUN npx nest build ${APP_NAME}

# Stage 2 — Production
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Copy only runtime dependencies and built files
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Pass runtime arguments
ARG APP_NAME
ARG APP_PORT
ENV PORT=${APP_PORT}

EXPOSE ${APP_PORT}

# Start the service
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
