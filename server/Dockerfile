# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Expose port (will be overridden by environment variable)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]

