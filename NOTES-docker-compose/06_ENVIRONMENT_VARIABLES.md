# Environment Variables Guide

This document explains all environment variables used in the application and how to configure them.

## Overview

Environment variables store configuration that changes between environments (development, production) without changing code.

## Server Environment Variables

### Required Variables

#### `PORT`
- **Purpose**: Port number for the Express server
- **Default**: 5000
- **Example**: `5000`
- **Where used**: `server/server.js`
- **How to set**: 
  - In `.env` file: `PORT=5000`
  - In docker-compose.yml: `PORT=${PORT:-5000}`
  - GitHub Secret: `PORT` (already added)

#### `MONGODB_URI`
- **Purpose**: MongoDB database connection string
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
- **Example**: `mongodb+srv://user:pass123@cluster0.abc123.mongodb.net/rbac-db?retryWrites=true&w=majority`
- **Where used**: `server/config/db.js`
- **How to set**:
  - In `.env` file: `MONGODB_URI=your_connection_string`
  - GitHub Secret: `MONGODB_URI` (already added)
- **How to get**:
  1. Go to MongoDB Atlas
  2. Click "Connect" on your cluster
  3. Choose "Connect your application"
  4. Copy connection string
  5. Replace `<password>` with your password

#### `JWT_SECRET`
- **Purpose**: Secret key for signing and verifying JWT tokens
- **Requirements**: Long, random, secret string
- **Example**: `my-super-secret-jwt-key-12345-abcdef`
- **Where used**: `server/middleware/auth.js` (for token verification)
- **How to set**:
  - In `.env` file: `JWT_SECRET=your_secret_key`
  - GitHub Secret: `JWT_SECRET` (already added)
- **How to generate**:
  ```bash
  # Using Node.js
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  
  # Using OpenSSL
  openssl rand -hex 64
  
  # Or use online generator (less secure)
  ```

#### `NODE_ENV`
- **Purpose**: Environment mode (development or production)
- **Values**: `development` or `production`
- **Default**: `production` (in docker-compose)
- **Where used**: Throughout Node.js (affects behavior)
- **Effects**:
  - `production`: Optimized, less verbose errors
  - `development`: More logging, helpful error messages

## Client Environment Variables

### Required Variables

#### `REACT_APP_API_URL`
- **Purpose**: Backend API URL for React app to connect to
- **Format**: `http://IP:PORT` or `http://domain.com`
- **Example**: `http://139.59.6.209:5000`
- **Where used**: `client/src/config/api.js`
- **Important**: 
  - Must start with `REACT_APP_` prefix
  - Set at **build time** (not runtime)
  - Baked into JavaScript during `npm run build`
- **How to set**:
  - In docker-compose.yml build args:
    ```yaml
    args:
      # Recommended (reverse-proxy): frontend uses relative path so Nginx proxies API
      - REACT_APP_API_URL=/api
      # Alternative (no reverse-proxy): frontend calls backend directly
      # - REACT_APP_API_URL=http://139.59.6.209:5000
    ```
  - Or create `.env` file in `client/` directory:
    ```
REACT_APP_API_URL=http://139.59.6.209:5000  # or /api when using reverse-proxy
    ```

## Environment Files

### Server .env File

Create `.env` in project root (same level as docker-compose.yml):

```env
# Server Port
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Node Environment
NODE_ENV=production
```

### Client .env File (Optional)

Create `.env` in `client/` directory:

```env
REACT_APP_API_URL=http://139.59.6.209:5000
```

**Note**: If using docker-compose, this is set via build args, so `.env` is optional.

## GitHub Secrets

Secrets are stored in GitHub repository settings and used by GitHub Actions.

### How to Add Secrets

1. Go to GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter name and value
5. Click **Add secret**

### Required Secrets

1. **SSH_PRIVATE_KEY**: Your SSH private key for server access
2. **MONGODB_URI**: MongoDB connection string (already added)
3. **JWT_SECRET**: JWT secret key (already added)
4. **PORT**: Server port (already added, default: 5000)

## Docker Compose Environment Variables

The `docker-compose.yml` file uses environment variables in two ways:

### 1. Build Arguments (for client)
```yaml
build:
  args:
    - REACT_APP_API_URL=http://139.59.6.209:${PORT:-5000}
```
- Used during Docker build
- Sets API URL in React app

### 2. Runtime Environment (for server)
```yaml
environment:
  - NODE_ENV=production
  - PORT=${PORT:-5000}
  - MONGODB_URI=${MONGODB_URI}
  - JWT_SECRET=${JWT_SECRET}
```
- Used when container runs
- `${VARIABLE:-default}`: Uses VARIABLE if set, else default

## How Variables Are Loaded

### Development (Local)
1. Create `.env` file
2. Variables loaded automatically by:
   - `dotenv` package (server)
   - `react-scripts` (client, if using Create React App)

### Production (Docker)
1. `.env` file read by docker-compose
2. Variables passed to containers via `environment:` section
3. Client variables set during build via `args:`

## Variable Priority

1. **Docker environment** (highest priority)
2. `.env` file
3. System environment variables
4. Default values (lowest priority)

## Security Best Practices

### ✅ DO:
- Store secrets in GitHub Secrets (not in code)
- Use strong, random JWT secrets
- Rotate secrets periodically
- Use different secrets for dev/prod
- Never commit `.env` files to git

### ❌ DON'T:
- Commit `.env` files
- Hardcode secrets in code
- Share secrets in chat/email
- Use weak secrets
- Use same secrets everywhere

## .gitignore

Make sure `.env` is in `.gitignore`:

```
# Environment variables
.env
.env.local
.env.production
```

## Troubleshooting

### Variables not working in server
```bash
# Check .env file exists
ls -la .env

# Check file format (no spaces around =)
cat .env

# Restart containers
docker-compose restart
```

### Client can't connect to API
- Verify `REACT_APP_API_URL` was set during build
- Check the built JavaScript contains correct URL
- Rebuild if you change the URL:
  ```bash
  docker-compose build --no-cache client
  docker-compose up -d
  ```

### MongoDB connection fails
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist
- Verify username/password are correct
- Check network connectivity

### JWT tokens not working
- Verify `JWT_SECRET` matches between server restarts
- Check secret is long enough (at least 32 characters)
- Ensure same secret used for signing and verifying

## Testing Environment Variables

### Check server variables
```bash
# Inside server container
docker exec node-react-rbac-server env | grep -E "PORT|MONGODB|JWT"

# Or check logs
docker-compose logs server | grep -i env
```

### Check client variables
```bash
# Build and check
docker-compose build client
docker run --rm node-react-rbac-client env | grep REACT_APP
```

## Production Checklist

- [ ] All required variables set
- [ ] `.env` file created on server
- [ ] GitHub Secrets configured
- [ ] JWT_SECRET is strong and random
- [ ] MONGODB_URI is correct
- [ ] REACT_APP_API_URL points to correct server
- [ ] `.env` in `.gitignore`
- [ ] No secrets in code
- [ ] Different secrets for dev/prod

## Next Steps

1. Set up environment-specific configs
2. Learn about Docker secrets
3. Implement secret rotation
4. Set up monitoring for secret leaks

