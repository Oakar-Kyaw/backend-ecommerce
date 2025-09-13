FROM node:20-alpine

WORKDIR /app

# Copy the entire monorepo workspace
COPY . .

# Install all dependencies
RUN npm ci

# Build the specific NestJS application
RUN npm run build auth

# Expose the ports your NestJS app listens on
EXPOSE 5003
EXPOSE 5004

# Define the command to run your application
CMD ["node", "dist/apps/auth/main.js"]