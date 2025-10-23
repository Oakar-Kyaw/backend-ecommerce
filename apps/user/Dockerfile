# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy everything and debug
COPY . .

# Debug: List what was copied
RUN echo "=== Listing /app directory ===" && ls -la
RUN echo "=== Checking for package.json ===" && ls -la package*.json || echo "No package.json found!"
RUN echo "=== Listing subdirectories ===" && ls -la */

# Install and build
RUN npm install
RUN npx prisma generate --schema=apps/user/prisma/schema.prisma
RUN npm run build user

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm install --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/user/prisma ./apps/user/prisma

EXPOSE 5001

CMD ["node", "dist/apps/user/main.js"]