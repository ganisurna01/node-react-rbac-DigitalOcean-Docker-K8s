# Automated Deployment Guide (CI/CD with GitHub Actions)

This guide explains how to set up automated deployment using GitHub Actions. Once configured, every push to the main branch will automatically deploy to your Digital Ocean droplet.

## Prerequisites

1. **Digital Ocean Droplet** with IP: 139.59.6.209
2. **SSH Access** to the droplet (root user)
3. **GitHub Repository** with push access
4. **Docker** installed on the droplet
5. **Docker Compose** installed on the droplet
6. **Git** repository cloned on the server

## Step 1: Initial Server Setup for Automated Deployment

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

### 1.4 Set Up SSH Key for GitHub on Droplet

**Why:** GitHub doesn't support password authentication. We need SSH keys.

#### Step 1: Generate SSH Key on the Droplet
```bash
# Generate SSH key on the droplet
ssh-keygen -t ed25519 -C "droplet-github_OR_ANY_STRING"  -f /root/.ssh/id_ed25519_droplet_YOUR_PROJECT_NAME  # YOUR_PROJECT_NAME --> To avaoid over writing prompt like --> /root/.ssh/id_ed25519 already exists. Overwrite (y/n)? y

# Press Enter for all prompts (default location, no passphrase)
```

#### Step 2: Copy the Public Key
```bash
# Display the public key
cat ~/.ssh/id_ed25519_droplet_YOUR_PROJECT_NAME.pub

# Copy the entire output (starts with ssh-ed25519...) 👉 Copy the ENTIRE line:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICt0+e1KqtSNKgnsW6lHxQhd3fHjxUbOvr0c6W/bC3Bc droplet-github
```

#### Step 3: Add SSH Key to GitHub

1. Go to GitHub: **Settings** → **SSH and GPG Keys** → **New SSH key**
        a. **Top-right corner** → click your **profile picture**
        b. Click **Settings**
        c. In the left sidebar, scroll down to **“Access”**
        d. Click **SSH and GPG keys**
        e. Click **New SSH key**
2. **Title**: `DigitalOcean Droplet`
3. **Key**: Paste the public key you copied
4. Click **Add SSH key**

#### Step 4: Test GitHub Connection
```bash
# Test SSH connection to GitHub
ssh -T git@github.com

# You should see:
# Hi Ganesh-Surna! You've successfully authenticated, but GitHub does not provide shell access.
```

#### Step 5: Clone Repository Using SSH ✅
```bash
# Now clone using SSH (no username/password needed)
git clone git@github.com:Ganesh-Surna-RGUKT/node-react-rbac.git .
# (dot . means “clone into current directory” - /var/www/node-react-rbac)

# ✅ No username prompt
# ✅ No password prompt
# ✅ No token needed
# ✅ Works forever

# RESULT : warning: You appear to have cloned an empty repository.
```

**Note:** This is a one-time setup. After this, GitHub Actions will handle updates via `git pull`.

### 1.5 Create .env File
```bash
cd /var/www/node-react-rbac
nano .env
```

Add environment variables:
```env
MONGODB_URI=mongodb+srv://surnaganesh123:GNI4rjFTTHIznyo2@cluster0.vqqhoi4.mongodb.net/react_node_rbac?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=production
REACT_APP_API_URL=/api
```
1. Click Ctrl+O To Save
2. Click Enter ---> (to confirm the filename - .env & then it will be saved)
3. Click Ctrl+X to Exit

**Important:** 
- Replace placeholder values with your actual credentials
- This file stays on the server and is NOT committed to git
- GitHub Actions will use this file when deploying

### 1.6 Initial Build and Start

**Important:** Run these commands from `/var/www/node-react-rbac` directory (where you cloned the repository). - If we have code in repo.
**But initally no code in repo. Leave this Step.**

```bash
# Make sure you're in the correct directory
cd /var/www/node-react-rbac

# Verify you're in the right place (should show docker-compose.yml)
ls -la

# Build images
docker compose build # Executes docker-compose.yml in the current directory(/var/www/node-react-rbac)

# Start containers
docker compose up -d

# Verify everything is running
docker compose ps
```

**Why this directory?**
- The `docker-compose.yml` file is in this directory
- The `.env` file is in this directory
- Docker Compose looks for `docker-compose.yml` in the current directory

## Step 2: Set Up SSH Key for GitHub Actions

### 2.1 Generate SSH Key (On Your Local Machine: In WSL)

```bash
# On your local machine(In WSL), ✅✅if you don't have SSH key✅✅
# ed25519 is more secure and faster than RSA
ssh-keygen -t ed25519 -C "github-actions-OR_ANY_STRING" -f /home/ganeshsurna/.ssh/id_ed25519_YOUR_PROJECT_NAME # YOUR_PROJECT_NAME --> To avaoid over writing prompt like --> /home/ganeshsurna/.ssh/id_ed25519 already exists. Overwrite (y/n)? 

# When prompted:
# - Press Enter to accept default location (~/.ssh/id_ed25519)
# - Press Enter twice to create key WITHOUT passphrase
#   (GitHub Actions needs passwordless key)
```

### 2.2 Copy Public Key to Server

```bash
# Copy the public key to the server
# This allows the private key to authenticate
ssh-copy-id root@139.59.6.209

# Or manually:
cat ~/.ssh/id_ed25519_YOUR_PROJECT_NAME.pub | ssh root@139.59.6.209 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 2.3 Test SSH Connection

```bash
# Test that you can connect without password
ssh root@139.59.6.209

# If it works, exit
exit
```

## Step 3: Add SSH Private Key to GitHub Secrets

### 3.1 Get Your Private Key

```bash
# On your local machine (WSL)
cat ~/.ssh/id_ed25519_YOUR_PROJECT_NAME

# The above command will print something like:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----
```

### 3.2 Add to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/Ganesh-Surna/node-react-rbac`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the ENTIRE private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
6. Click **Add secret**

**Important:**
- Copy the ENTIRE key including the header and footer
- Never share your private key publicly
- This key allows GitHub Actions to SSH into your server

## Step 4: Verify GitHub Actions Workflow

### 4.1 Check Workflow File

The workflow file is already configured at `.github/workflows/deploy.yml`. It will:
1. Trigger on push to `main` branch
2. Connect to server via SSH
3. Pull latest code
4. Rebuild Docker images
5. Restart containers

### 4.2 Test the Deployment

```bash
# Make a small change (add a comment to any file),
# Commit and push
git add .
git commit -m "Test automated deployment"
git push origin main
```

### 4.3 Monitor Deployment

1. Go to GitHub repository
2. Click **Actions** tab
3. You should see "Deploy to Digital Ocean" workflow running
4. Click on it to see logs
5. Wait for it to complete (green checkmark = success)

## How Automated Deployment Works

### Workflow Process

When you push code to `main` branch:

1. **GitHub detects push** → Triggers workflow
2. **Workflow starts** → Runs on Ubuntu runner
3. **Checkout code** → Downloads repository
4. **SSH to server** → Connects using SSH_PRIVATE_KEY
5. **Pull latest code** → `git pull origin main`
6. **Stop containers** → `docker-compose down`
7. **Rebuild images** → `docker-compose build --no-cache`
8. **Start containers** → `docker-compose up -d`
9. **Verify** → `docker-compose ps`

### What Gets Deployed

- **Client (Frontend)**: React app built and served via Nginx
- **Server (Backend)**: Node.js Express API
- **Configuration**: Uses `.env` file on server (not from GitHub)

## Step 5: Verify Deployment

After automated deployment completes:

1. **Check Server Health:**
   ```bash
   curl http://139.59.6.209:5000/api/health
   ```
   Should return: `{"message":"Server is running!"}`

2. **Access Frontend:**
   Open browser: `http://139.59.6.209:3000`

3. **Check Container Status:**
   ```bash
   ssh root@139.59.6.209
   cd /var/www/node-react-rbac
   docker-compose ps
   ```

## Troubleshooting Automated Deployment

### Workflow Fails: SSH Connection Failed

**Problem:** Can't connect to server

**Solutions:**
- Verify `SSH_PRIVATE_KEY` secret is correct in GitHub
- Check you copied the ENTIRE key (including headers)
- Verify public key is on server: `cat ~/.ssh/authorized_keys` on server
- Test SSH manually: `ssh root@139.59.6.209`
- Check server IP is correct in workflow file

### Workflow Fails: Git Pull Failed

**Problem:** Can't pull code on server

**Solutions:**
- Verify repository is cloned on server
- Check git remote: `cd /var/www/node-react-rbac && git remote -v`
  - Should show: `git@github.com:Ganesh-Surna/node-react-rbac.git` (SSH)
  - If it shows HTTPS, change it: `git remote set-url origin git@github.com:Ganesh-Surna/node-react-rbac.git`
- Verify SSH key is set up on droplet (Step 1.4)
- Test GitHub connection: `ssh -T git@github.com`
- Verify server has internet access

### Workflow Fails: Docker Commands Failed

**Problem:** Docker commands error

**Solutions:**
- Check Docker is installed: `docker --version` on server
- Verify docker-compose is installed
- Check user has Docker permissions
- Review docker-compose.yml syntax
- Check `.env` file exists and has correct values

### Workflow Succeeds but App Doesn't Work

**Problem:** Deployment completes but app is broken

**Solutions:**
- Check container logs: `docker-compose logs`
- Verify environment variables in `.env` file
- Check MongoDB connection
- Verify ports are open: `ufw status`
- Test health endpoint: `curl http://139.59.6.209:5000/api/health`

## Manual Override

If automated deployment fails, you can always deploy manually:

```bash
ssh root@139.59.6.209
cd /var/www/node-react-rbac
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
```

## Updating Environment Variables

If you need to update environment variables:

```bash
# SSH into server
ssh root@139.59.6.209

# Edit .env file
cd /var/www/node-react-rbac
nano .env

# Restart containers to apply changes
docker-compose restart
```

**Note:** Environment variable changes require container restart. The `.env` file is NOT pulled from git (it's in .gitignore).

## Workflow File Location

The automated deployment workflow is configured in:
```
.github/workflows/deploy.yml
```

You can customize it if needed, but the default configuration should work for most cases.

## Security Best Practices

1. ✅ **Use ed25519 SSH keys** - More secure than RSA
2. ✅ **No passphrase on key** - Required for GitHub Actions
3. ✅ **Keep private key secret** - Only in GitHub Secrets
4. ✅ **Rotate keys periodically** - Change SSH keys every 6-12 months
5. ✅ **Monitor Actions logs** - Check for unauthorized access
6. ✅ **Use non-root user** - Consider creating dedicated deploy user (advanced)

## Benefits of Automated Deployment

- ✅ **No manual steps** - Push code, deployment happens automatically
- ✅ **Consistent deployments** - Same process every time
- ✅ **Faster updates** - No need to SSH and run commands
- ✅ **Deployment history** - See all deployments in GitHub Actions
- ✅ **Error visibility** - Logs show exactly what went wrong

## Next Steps

1. Set up deployment notifications (email/Slack)
2. Add health checks after deployment
3. Set up staging environment
4. Implement rollback strategy
5. Add deployment status badges to README

