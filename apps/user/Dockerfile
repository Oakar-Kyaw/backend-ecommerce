# # Stage 1: Builder
# FROM node:20-alpine AS builder

# WORKDIR /app

# # Copy the entire monorepo workspace
# COPY . .

# # Install dependencies (from root package.json)
# # Using 'npm ci' for clean installs based on package-lock.json
# RUN npm ci

# RUN npx prisma generate --schema=apps/user/schema/prisma/schema.prisma

# # Build the specific NestJS application
# # Replace 'your-app-name' with the actual name of your NestJS app in the monorepo
# RUN npm run build user

# # Stage 2: Production
# FROM node:20-alpine

# WORKDIR /app

# # Copy only the built application from the builder stage
# # Adjust the path based on your monorepo's build output structure (e.g., dist/apps/your-app-name)
# COPY --from=builder /app/dist/apps/user ./dist

# # Copy package.json and package-lock.json for production dependencies
# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/package-lock.json ./

# # Install production dependencies only
# RUN npm ci --omit=dev

# # Expose the port your NestJS app listens on
# EXPOSE 5001

# EXPOSE 5002

# # Define the command to run your application
# # Adjust the path to your main.js file within the built app
# CMD ["node", "dist/main.js"]

FROM node:20-alpine

WORKDIR /app

# Copy the entire monorepo workspace
COPY . .

# Install all dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=apps/user/schema/prisma/schema.prisma

# Build the specific NestJS application
RUN npm run build user

# Expose the ports your NestJS app listens on
EXPOSE 5001
EXPOSE 5002

# Define the command to run your application
CMD ["node", "dist/apps/user/main.js"]