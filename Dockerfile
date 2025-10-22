# Stage 1: Build the application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install && npm install -g @nestjs/cli prisma

# Copy all source files
COPY . .

# Generate Prisma clients (now schema files exist)
RUN npx prisma generate --schema=./apps/auth/prisma/schema.prisma \
 && npx prisma generate --schema=./apps/notification/prisma/schema.prisma \
 && npx prisma generate --schema=./apps/user/prisma/schema.prisma

# Build NestJS apps
RUN nest build user && nest build auth

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY --from=build /app/package*.json ./

# Install production dependencies
RUN npm install --production

# Copy built apps
COPY --from=build /app/dist ./dist

# Copy ALL generated Prisma clients
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Install concurrently
RUN npm install -g concurrently

EXPOSE 5001
EXPOSE 5003

CMD ["concurrently", "node dist/apps/user/main.js", "node dist/apps/auth/main.js"]