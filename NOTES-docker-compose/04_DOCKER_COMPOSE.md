# Docker Compose Explained - Step by Step

This document explains what the docker-compose.yml file does, line by line.

## Overview

Docker Compose orchestrates multiple containers (client and server) to work together as one application.

## Complete docker-compose.yml

```yaml
version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: node-react-rbac-server
    restart: unless-stopped
    ports:
      - "${PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-5000}
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - app-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        # When using the included reverse-proxy setup (recommended):
        - REACT_APP_API_URL=/api
        # Without reverse-proxy (frontend calls backend directly from browser):
        # - REACT_APP_API_URL=http://139.59.6.209:${PORT:-5000}
    container_name: node-react-rbac-client
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - server
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Step-by-Step Explanation

### `version: '3.8'`
- **What it does**: Specifies Docker Compose file format version
- **Why**: Different versions support different features
- **Version 3.8**: Modern version with good feature support

### `services:`
- **What it does**: Defines the containers (services) to run
- **Why**: Groups related containers together
- **In our case**: We have 2 services - `server` and `client`

## Server Service

### `server:`
- **What it does**: Defines the backend service
- **Name**: Can be anything, we call it "server"

### `build:`
- **What it does**: Tells Docker how to build the image
- **context: ./server**: Directory containing Dockerfile
- **dockerfile: Dockerfile**: Name of Dockerfile (default, can be omitted)

### `container_name: node-react-rbac-server`
- **What it does**: Sets a specific name for the container
- **Why**: Easier to reference: `docker logs node-react-rbac-server`
- **Without this**: Docker generates random name like `project_server_1`

### `restart: unless-stopped`
- **What it does**: Automatically restarts container if it crashes
- **unless-stopped**: Restart always, unless manually stopped
- **Other options**:
  - `no`: Never restart
  - `always`: Always restart (even after reboot)
  - `on-failure`: Only restart on error

### `ports:`
- **What it does**: Maps container ports to host ports
- **Format**: `"HOST_PORT:CONTAINER_PORT"`
- **"${PORT:-5000}:5000"**: 
  - Uses PORT from .env file (or default 5000)
  - Maps to container port 5000
  - Example: If PORT=5000, maps `5000:5000`

### `environment:`
- **What it does**: Sets environment variables inside container
- **NODE_ENV=production**: Tells Node.js it's production
- **PORT=${PORT:-5000}**: Uses PORT from .env or defaults to 5000
- **MONGODB_URI=${MONGODB_URI}**: Gets from .env file
- **JWT_SECRET=${JWT_SECRET}**: Gets from .env file
- **${VARIABLE:-default}**: Uses VARIABLE if set, else uses default

### `networks:`
- **What it does**: Connects container to a network
- **app-network**: Custom network name
- **Why**: Allows containers to communicate with each other

## Client Service

### `client:`
- **What it does**: Defines the frontend service
- **Name**: Can be anything, we call it "client"

### `build:`
- **context: ./client**: Client directory
- **dockerfile: Dockerfile**: Client Dockerfile
- **args:**: Build arguments (passed during build)
  - **REACT_APP_API_URL**: Sets API URL for React app
  - **Value**: `http://139.59.6.209:${PORT:-5000}`
  - **Why**: React needs to know where backend is

### `ports:`
- **"3000:80"**: Maps host port 3000 to container port 80
- **Why**: Nginx serves on port 80 inside container
- **Access**: Frontend available at `http://139.59.6.209:3000`

### `depends_on:`
- **What it does**: Ensures server starts before client
- **Why**: Client needs server to be running
- **Note**: Only waits for container to start, not for server to be ready

### `networks:`
- **app-network**: Same network as server
- **Why**: Containers on same network can communicate

## Networks Section

### `networks:`
- **What it does**: Defines custom networks
- **app-network**: Name of our network
- **driver: bridge**: Network type (default, allows container communication)

## How It All Works Together

```
┌─────────────────────────────────────────┐
│         Docker Host (Server)             │
│                                          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Client     │    │   Server     │  │
│  │  (Port 80)   │    │  (Port 5000) │  │
│  │              │    │              │  │
│  └──────┬───────┘    └──────┬───────┘  │
│         │                    │          │
│         └────────┬───────────┘          │
│                  │                      │
│         ┌────────▼────────┐            │
│         │  app-network    │            │
│         └─────────────────┘            │
│                                          │
│  Port Mapping:                           │
│  3000 → Client:80                        │
│  5000 → Server:5000                      │
└──────────────────────────────────────────┘
```

## Environment Variables

Create `.env` file in project root:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secret-jwt-key-here
```

Docker Compose automatically reads this file and uses variables.

## Common Commands

### Start Services
```bash
docker-compose up -d
```
- **-d**: Detached mode (runs in background)
- **up**: Start all services

### Stop Services
```bash
docker-compose stop
```
- Stops containers but keeps them

### Stop and Remove
```bash
docker-compose down
```
- Stops and removes containers
- **-v**: Also removes volumes

### View Logs
```bash
docker-compose logs
docker-compose logs server
docker-compose logs client
docker-compose logs -f  # Follow (live updates)
```

### Rebuild
```bash
docker-compose build
docker-compose build --no-cache  # Force rebuild
```

### Restart
```bash
docker-compose restart
docker-compose restart server  # Restart specific service
```

### Check Status
```bash
docker-compose ps
```

## Container Communication

Containers on same network can communicate using service names:

**From client container:**
```javascript
// Can use service name instead of IP
const API_URL = 'http://server:5000';
```

**Why**: Docker DNS resolves service names to container IPs.

**In our case (two options)**:

- With reverse-proxy (current setup): The client is built to use a relative API path (`/api`). The browser requests go to the frontend origin (e.g. `http://139.59.6.209:3000`) and Nginx inside the client container proxies `/api` requests to the backend service (`server:5000`). This avoids CORS and is the recommended setup for deployments using Docker Compose.

- Without reverse-proxy (legacy/default): React must call a full public URL because the app runs in the browser (not in the container). Example: `http://139.59.6.209:5000`. Use this if you don't want to proxy via Nginx.

## Port Mapping Explained

**Format**: `"HOST:CONTAINER"`

- **HOST**: Port on your server (accessible from outside)
- **CONTAINER**: Port inside container (where app listens)

**Example**: `"3000:80"`
- Browser connects to: `http://139.59.6.209:3000`
- Docker forwards to: container port 80
- Nginx serves files on port 80 inside container

## Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Change ports in docker-compose.yml
```

### Containers can't communicate
- Verify both on same network (`app-network`)
- Check service names match
- Verify containers are running: `docker-compose ps`

### Environment variables not working
- Check `.env` file exists in project root
- Verify variable names match exactly
- Restart containers after changing .env

### Build fails
```bash
# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
# Verify all files exist
```

## Production vs Development

**Current setup**: Production-ready
- Uses production builds
- Optimized images
- Proper networking

**For development**, you might want:
- Volume mounts (live code reload)
- Development dependencies
- Hot reload enabled
- More verbose logging

## Best Practices

1. **Use .env file**: Never hardcode secrets
2. **Name containers**: Easier to manage
3. **Set restart policy**: Auto-recover from crashes
4. **Use networks**: Isolate and organize containers
5. **Version control**: Keep docker-compose.yml in git (not .env)

## Next Steps

1. Learn about Docker volumes (persistent data)
2. Understand Docker health checks
3. Study Docker secrets management
4. Learn about multi-stage builds optimization

