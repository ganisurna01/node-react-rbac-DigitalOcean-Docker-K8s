# Build stage - Create production build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files - COPY source destination
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files - COPY source destination
COPY . .

# Build argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app for production
RUN npm run build

# Production stage - Serve with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

