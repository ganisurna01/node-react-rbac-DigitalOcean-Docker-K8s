# Server Dockerfile Explained - Step by Step

This document explains what the server Dockerfile does, line by line.

## Overview

The server Dockerfile creates a container that runs the Node.js Express backend server.

## Complete Dockerfile

```dockerfile
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
```

## Step-by-Step Explanation

### `FROM node:18-alpine`
- **What it does**: Uses Node.js version 18 on Alpine Linux as base image
- **Why Alpine**: Much smaller than regular Linux (5MB vs 200MB+)
- **Why Node 18**: Latest LTS version, stable and well-supported
- **Result**: Container has Node.js and npm pre-installed

### `WORKDIR /app`
- **What it does**: Creates `/app` directory and sets it as working directory
- **Why**: All commands will run from this directory
- **Like**: Running `cd /app` in terminal
- **Benefit**: All file paths are relative to `/app`

### `COPY package*.json ./`
- **What it does**: Copies `package.json` and `package-lock.json` files
- **Why**: We copy dependency files first (Docker optimization)
- **Docker Layer Caching**: If dependencies don't change, Docker reuses cached layer
- **Result**: Faster builds when only code changes

### `RUN npm install`
- **What it does**: Installs all dependencies listed in `package.json`
- **What gets installed**:
  - express (web framework)
  - mongoose (MongoDB driver)
  - bcryptjs (password hashing)
  - jsonwebtoken (JWT tokens)
  - dotenv (environment variables)
  - cors (cross-origin requests)
- **Result**: Creates `node_modules/` folder with all packages

### `COPY . .`
- **What it does**: Copies all remaining files from current directory to `/app`
- **What gets copied**:
  - `server.js` (main server file)
  - `config/` (database configuration)
  - `models/` (MongoDB models)
  - `routes/` (API routes)
  - `middleware/` (authentication middleware)
- **Note**: `.dockerignore` prevents copying unnecessary files like `node_modules`

### `EXPOSE 5000`
- **What it does**: Documents that container listens on port 5000
- **Why**: Express server runs on port 5000 (or PORT from environment)
- **Note**: Doesn't actually open port, just documents it
- **Actual port**: Set via `PORT` environment variable or default 5000

### `CMD ["npm", "start"]`
- **What it does**: Runs `npm start` when container starts
- **What happens**: Executes `node server.js` (from package.json scripts)
- **Result**: Express server starts and listens for requests

## How It Works

```
Base Image (Node.js) 
  → Install Dependencies 
    → Copy Code 
      → Start Server 
        → Listen on Port 5000
```

## Environment Variables

The server needs these environment variables (set in docker-compose.yml or .env):

1. **PORT**: Server port (default: 5000)
2. **MONGODB_URI**: MongoDB connection string
3. **JWT_SECRET**: Secret key for JWT token signing
4. **NODE_ENV**: Set to "production" for production

## How to Build Manually

```bash
# Navigate to server directory
cd server

# Build the image
docker build -t node-react-rbac-server .

# Run the container
docker run -p 5000:5000 \
  -e PORT=5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_jwt_secret \
  node-react-rbac-server
```

## Docker Layer Caching

Docker caches each step (layer). Order matters:

**Good Order (current):**
```dockerfile
COPY package*.json ./    # Layer 1: Dependencies list
RUN npm install          # Layer 2: Install (cached if package.json unchanged)
COPY . .                 # Layer 3: Code (changes frequently)
```

**Bad Order:**
```dockerfile
COPY . .                 # Layer 1: Everything (changes frequently)
RUN npm install          # Layer 2: Always rebuilds (no cache benefit)
```

**Benefit**: If only code changes, Docker reuses cached `npm install` layer = faster builds!

## .dockerignore File

Prevents copying unnecessary files:

```
node_modules    # Don't copy (will be installed fresh)
npm-debug.log   # Log files
.env            # Environment variables (use docker-compose env instead)
.git            # Git files (not needed in container)
.gitignore      # Git config
README.md       # Documentation
```

**Why**: Smaller images, faster builds, more secure

## Container Lifecycle

1. **Build**: `docker build` creates image with all code and dependencies
2. **Start**: `docker run` or `docker-compose up` starts container
3. **Run**: Server starts and listens for requests
4. **Stop**: Container stops when you stop it or server crashes

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs <container-name>

# Common issues:
# - Missing environment variables
# - MongoDB connection failed
# - Port already in use
```

### Dependencies not installing
- Check `package.json` syntax
- Verify internet connection
- Check npm registry access

### Server crashes on start
- Check MongoDB connection string
- Verify all environment variables are set
- Check server.js for syntax errors

### Port conflicts
```bash
# Check what's using port 5000
lsof -i :5000

# Change port in docker-compose.yml or .env
```

## Production Considerations

1. **Use specific Node version**: `node:18-alpine` (not `node:latest`)
2. **Set NODE_ENV=production**: Enables production optimizations
3. **Health checks**: Add health check endpoint
4. **Logging**: Configure proper logging
5. **Security**: Keep dependencies updated
6. **Resource limits**: Set memory/CPU limits in docker-compose

## Comparison: Development vs Production

**Development:**
- Uses `nodemon` for auto-restart
- More verbose logging
- Hot reload enabled

**Production:**
- Uses `node` directly
- Minimal logging
- Optimized for performance
- Environment variables from .env or docker-compose

## Next Steps

After understanding the Dockerfile:
1. Learn about docker-compose.yml (orchestration)
2. Understand environment variable management
3. Learn about Docker networking
4. Study container health checks

