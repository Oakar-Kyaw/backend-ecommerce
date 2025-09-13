
# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
# RUN npm install
RUN npm ci --prefer-offline --no-audit

# Copy the rest of the application files
COPY . .

# Generate Prisma Client (important before build)
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "start:prod"]
