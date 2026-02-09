# Manual Deployment Guide

This guide explains how to manually deploy the Node React RBAC application to Digital Ocean Droplet using Docker.

## Prerequisites

1. **Digital Ocean Droplet** with IP: 139.59.6.209
2. **SSH Access** to the droplet (root user)
3. **Docker** installed on the droplet
4. **Docker Compose** installed on the droplet

## Step 1: Initial Server Setup (⭐⭐MANUALLY⭐⭐)

### 1.1 Connect to Your Droplet
```bash
ssh root@139.59.6.209
```

### 1.2 Install Docker (if not already installed)
```bash
# Update system
apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 1.3 Create Application Directory
```bash
# Navigate to /var/www
cd /var/www

# Create directory for our app
mkdir -p node-react-rbac
cd node-react-rbac
```

## Step 2: Set Up SSH Key for GitHub on Droplet

**Why:** GitHub doesn't support password authentication. We need SSH keys for cloning.

### 2.1 Generate SSH Key on the Droplet
```bash
# Generate SSH key on the droplet
ssh-keygen -t ed25519 -C "droplet-github"

# Press Enter for all prompts (default location, no passphrase)
```

### 2.2 Copy the Public Key
```bash
# Display the public key
cat ~/.ssh/id_ed25519.pub

# Copy the entire output (starts with ssh-ed25519...)
```

### 2.3 Add SSH Key to GitHub

1. Go to GitHub: **Settings** → **SSH and GPG Keys** → **New SSH key**
2. **Title**: `DigitalOcean Droplet`
3. **Key**: Paste the public key you copied
4. Click **Add SSH key**

### 2.4 Test GitHub Connection
```bash
# Test SSH connection to GitHub
ssh -T git@github.com

# You should see:
# Hi Ganesh-Surna! You've successfully authenticated, but GitHub does not provide shell access.
```

### 2.5 SSH key overwrite — recovery & GitHub Secrets (important)

What happened if you accidentally overwrote your key:

- You ran `ssh-keygen -t ed25519 -C "github-actions"` and answered `y` when prompted to overwrite.
- Result:
  - Old private key: GONE
  - Old public key: GONE
  - New private key: `~/.ssh/id_ed25519`
  - New public key: `~/.ssh/id_ed25519.pub`

Why this breaks CI/CD

- Your server now has the NEW public key (because you ran `ssh-copy-id root@139.59.6.209`).
- GitHub Actions (Project1) still has the OLD private key stored in `SSH_PRIVATE_KEY` secret.
- GitHub (old private key) ❌ → Server (new public key) → Permission denied (publickey)

Quick fix (simple & recommended)

1. On your local machine, print the new private key:

```bash
cat ~/.ssh/id_ed25519
```

2. Update GitHub Secrets for Project1 (and Project2 if needed):
   - GitHub → Project1 → Settings → Secrets and variables → Actions → Update `SSH_PRIVATE_KEY` with the NEW private key (paste the full output from `cat`).

3. Re-run GitHub Actions (push a small commit) to verify deployment succeeds.

Optional — cleaner approach (recommended for future)

- Create separate keys per project to avoid accidental overwrite:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_project1 -C "github-actions-project1"
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_project2 -C "github-actions-project2"
```

- Install the public keys on the server:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_project1.pub root@139.59.6.209
ssh-copy-id -i ~/.ssh/id_ed25519_project2.pub root@139.59.6.209
```

- In GitHub:
  - Project1 → `SSH_PRIVATE_KEY` = contents of `~/.ssh/id_ed25519_project1`
  - Project2 → `SSH_PRIVATE_KEY` = contents of `~/.ssh/id_ed25519_project2`

Notes
- Use separate keys for isolation and safer rotation.
- If you must rotate keys without downtime, add the new public key to the server first, then update GitHub Secrets, then remove the old key.

## Step 3: Clone Repository

### 3.1 Clone Using SSH ✅
```bash
# Clone the repository using SSH (no username/password needed)
git clone git@github.com:Ganesh-Surna/node-react-rbac.git .

# ✅ No username prompt
# ✅ No password prompt
# ✅ No token needed
# ✅ Works forever
```

### 3.2 Alternative: Use Deploy Script
```bash
# Or if you want to use the deploy script
chmod +x deploy.sh
./deploy.sh
```

## Step 4: Configure Environment Variables

### 4.1 Create .env File
```bash
cd /var/www/node-react-rbac
nano .env
```

### 4.2 Add Environment Variables
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
```

**Important:** Replace the placeholder values with your actual:
- MongoDB connection string (from MongoDB Atlas or your MongoDB instance)
- JWT secret (a long random string for token encryption)

## Step 5: Build and Run with Docker

**Important:** All docker-compose commands must be run from `/var/www/node-react-rbac` directory.

### 5.1 Build Images
```bash
# Make sure you're in the correct directory
cd /var/www/node-react-rbac

# Verify you're in the right place (should show docker-compose.yml)
ls -la

# Build images
docker-compose build
```

**Why this directory?**
- The `docker-compose.yml` file is in this directory
- The `.env` file is in this directory  
- Docker Compose looks for `docker-compose.yml` in the current directory

### 5.2 Start Containers
```bash
docker-compose up -d
```

The `-d` flag runs containers in detached mode (in the background).

### 5.3 Check Status
```bash
docker-compose ps
docker-compose logs
```

## Step 6: Verify Deployment

1. **Check Server Health:**
   ```bash
   curl http://139.59.6.209:5000/api/health
   ```
   Should return: `{"message":"Server is running!"}`
   
 1.5 **If you changed API URL / reverse-proxy info**

 - If you've switched to using the reverse-proxy, the client is built with `REACT_APP_API_URL=/api`. Rebuild the client to pick up the change:

 ```bash
 # Rebuild client with updated build arg
 docker-compose build --no-cache client
 docker-compose up -d
 ```
 - Test API via frontend at `http://139.59.6.209:3000` (API calls go through `/api` and are proxied to the backend).

2. **Access Frontend:**
   Open browser: `http://139.59.6.209:3000`

3. **Test Application:**
   - Register a new user
   - Login
   - Test different role-based pages

## Step 7: Firewall Configuration

Make sure these ports are open on your droplet:

```bash
# Allow port 5000 (backend)
ufw allow 5000/tcp

# Allow port 3000 (frontend)
ufw allow 3000/tcp

# Check firewall status
ufw status
```

## Step 8: Update Deployment (Manual)

When you make changes and want to redeploy:

```bash
# SSH into server
ssh root@139.59.6.209

# Navigate to app directory
cd /var/www/node-react-rbac

# Pull latest code
git pull origin main

# Stop containers
docker-compose down

# Rebuild images (with no cache to ensure fresh build)
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check status
docker-compose ps
```

## Maintenance Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs server
docker-compose logs client

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart server

# Stop services
docker-compose stop

# Start services
docker-compose start

# Remove everything (careful!)
docker-compose down -v
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs server
docker-compose logs client
```

### Port already in use
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3000

# Stop conflicting services or change ports in docker-compose.yml
```

### MongoDB connection issues
- Verify MONGODB_URI in .env file
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
- Verify network connectivity

### Frontend can't connect to backend
- Check REACT_APP_API_URL in docker-compose.yml build args
- Verify backend is running: `curl http://139.59.6.209:5000/api/health`
- Check CORS settings in server

### Build fails
```bash
# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
# Verify all files exist
```

## Directory Structure on Server

```
/var/www/
├── gurukulamhub/          # Your existing app (untouched)
└── node-react-rbac/       # New app
    ├── .env               # Environment variables
    ├── docker-compose.yml # Docker orchestration
    ├── client/            # Frontend code
    ├── server/            # Backend code
    └── .git/              # Git repository
```

## Security Notes

1. **Never commit .env file** - It contains sensitive information
2. **Use strong JWT_SECRET** - Generate a random long string
3. **Keep Docker updated** - Regularly update Docker and images
4. **Use HTTPS** - Set up SSL certificates for production
5. **Firewall rules** - Only open necessary ports

## Quick Reference

```bash
# Full deployment process
ssh root@139.59.6.209
cd /var/www/node-react-rbac
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
```

