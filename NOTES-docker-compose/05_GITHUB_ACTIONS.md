# GitHub Actions Workflow Explained - Step by Step

This document explains what the GitHub Actions deploy.yml workflow does, line by line.

## Overview

GitHub Actions automatically deploys your application to Digital Ocean whenever you push code to the main branch.

## Complete deploy.yml

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches:
      - main

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: 139.59.6.209
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/node-react-rbac
            git pull origin main
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
            sleep 5
            docker-compose ps
            echo "Deployment completed successfully!"
```

## Step-by-Step Explanation

### `name: Deploy to Digital Ocean`
- **What it does**: Names the workflow (shown in GitHub Actions tab)
- **Why**: Helps identify what this workflow does
- **Display**: Shows as "Deploy to Digital Ocean" in GitHub UI

### `on:`
- **What it does**: Defines when the workflow should run (triggers)
- **push:**: Triggers on git push
- **branches: - main**: Only triggers when pushing to `main` branch
- **Result**: Workflow runs automatically when you push to main

**Other trigger options:**
```yaml
on:
  push:              # On any push
  pull_request:       # On pull requests
  schedule:          # On schedule (cron)
  workflow_dispatch: # Manual trigger
```

### `concurrency:`
- **What it does**: Prevents multiple deployments from running simultaneously
- **Why**: Avoids conflicts when multiple commits are pushed quickly
- **group: deploy-${{ github.ref }}**: Groups deployments by branch reference
- **cancel-in-progress: true**: Cancels any in-progress deployment when a new one starts
- **Result**: Only the latest deployment runs, preventing port conflicts and resource issues

**Benefits:**
- Prevents "port already allocated" errors
- Ensures only latest code is deployed
- Saves CI/CD minutes by cancelling outdated runs
- Prevents Docker container conflicts

**Example scenario:**
```
1. Push commit A → Deployment starts
2. Push commit B (while A is running) → A is cancelled, B starts
3. Only commit B gets deployed (latest code)
```

### `jobs:`
- **What it does**: Defines jobs to run (can have multiple)
- **In our case**: One job called "deploy"

### `deploy:`
- **What it does**: Name of the job
- **Can be anything**: We call it "deploy"

### `runs-on: ubuntu-latest`
- **What it does**: Runs workflow on Ubuntu Linux virtual machine
- **Why**: GitHub provides free runners (virtual machines)
- **ubuntu-latest**: Latest Ubuntu version
- **Other options**: `windows-latest`, `macos-latest`

### `steps:`
- **What it does**: List of actions to perform (runs in order)
- **Why**: Each step does one thing
- **Execution**: Runs sequentially (one after another)

## Step 1: Checkout Code

### `- name: Checkout code`
- **What it does**: Descriptive name for the step
- **Shown in**: GitHub Actions UI

### `uses: actions/checkout@v3`
- **What it does**: Official GitHub action to download repository code
- **Why**: Workflow runner starts empty, needs your code
- **Result**: Code is available in `/home/runner/work/repo-name/repo-name`
- **Version**: @v3 is the action version (use latest stable)

## Step 2: Deploy to Server

### `- name: Deploy to server`
- **What it does**: Name for this deployment step

### `uses: appleboy/ssh-action@v0.1.7`
- **What it does**: Third-party action to SSH into server and run commands
- **Why**: We need to connect to Digital Ocean droplet
- **Author**: appleboy (popular GitHub Actions developer)
- **Version**: @v0.1.7 (specific version for stability)

### `with:`
- **What it does**: Parameters for the SSH action
- **Why**: Configures how to connect and what to do

### `host: 139.59.6.209`
- **What it does**: IP address of your Digital Ocean droplet
- **Why**: Tells action where to connect

### `username: root`
- **What it does**: SSH username
- **Why**: Root user has full access (use sudo user in production)

### `key: ${{ secrets.SSH_PRIVATE_KEY }}`
- **What it does**: Uses SSH private key from GitHub secrets
- **Why**: Authenticates without password
- **${{ }}**: GitHub Actions expression syntax
- **secrets.SSH_PRIVATE_KEY**: Secret you added in GitHub

### `script: |`
- **What it does**: Multi-line script to run on server
- **|**: YAML syntax for multi-line string
- **Why**: Runs commands on remote server via SSH

### Script Commands Explained

#### `cd /var/www/node-react-rbac`
- **What it does**: Changes to application directory
- **Why**: All commands run from this directory

#### `git pull origin main`
- **What it does**: Pulls latest code from GitHub
- **Why**: Gets the code you just pushed
- **Note**: Server must have git repository cloned

#### `docker-compose down`
- **What it does**: Stops and removes running containers
- **Why**: Need to stop old containers before starting new ones
- **Result**: Clean slate for new deployment

#### `docker-compose build --no-cache`
- **What it does**: Rebuilds Docker images from scratch
- **--no-cache**: Ignores cached layers (ensures fresh build)
- **Why**: New code changes need new images
- **Result**: Images with latest code

#### `docker-compose up -d`
- **What it does**: Starts containers in detached mode
- **-d**: Runs in background
- **Why**: Starts application with new code
- **Result**: Application is running

#### `sleep 5`
- **What it does**: Waits 5 seconds before checking container status
- **Why**: Gives containers time to fully start up
- **Result**: More accurate status check

#### `docker-compose ps`
- **What it does**: Shows container status
- **Why**: Verifies containers started successfully
- **Output**: Shown in GitHub Actions logs

#### `echo "Deployment completed successfully!"`
- **What it does**: Prints success message
- **Why**: Clear confirmation in logs that deployment finished
- **Output**: Visible in GitHub Actions workflow logs

## Complete Flow

```
1. You push code to main branch
   ↓
2. GitHub detects push
   ↓
3. Concurrency check:
   - If another deployment is running → Cancel it
   - If no deployment running → Proceed
   ↓
4. Workflow starts on Ubuntu runner
   ↓
5. Checkout code (downloads your repo)
   ↓
6. SSH to Digital Ocean server
   ↓
7. Pull latest code
   ↓
8. Stop old containers (docker-compose down)
   ↓
9. Build new images (docker-compose build --no-cache)
   ↓
10. Start new containers (docker-compose up -d)
   ↓
11. Wait 5 seconds (sleep 5)
   ↓
12. Verify deployment (docker-compose ps)
   ↓
13. Print success message
```

## Setting Up GitHub Secrets

### Step 1: Generate SSH Key Pair

**On your local machine: In WSL**
```bash
# Generate SSH key (if you don't have one)
# ed25519 is more secure and faster than RSA
ssh-keygen -t ed25519 -C "github-actions"

# Don't set a passphrase (or GitHub Actions won't work)
# Save as: ~/.ssh/id_ed25519 (default location)
```

### Step 2: Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id root@139.59.6.209

# Or manually:
cat ~/.ssh/id_ed25519.pub | ssh root@139.59.6.209 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3: Add Private Key to GitHub

```bash
cat ~/.ssh/id_ed25519

# The above command will print th like this:
        # -----BEGIN OPENSSH PRIVATE KEY-----
        # ...
        # -----END OPENSSH PRIVATE KEY-----
# 👉 Copy everything and paste it into: 
# GitHub Repo → Settings → Secrets → Actions → SSH_PRIVATE_KEY

```

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SSH_PRIVATE_KEY`
5. Value: Copy content of `~/.ssh/id_ed25519` (private key)
6. Click **Add secret**

**Important**: 
- Never share your private key
- Never commit it to git
- Only add to GitHub Secrets

## If you accidentally overwrote your SSH key (IMPORTANT)

What may have happened:

- You ran: `ssh-keygen -t ed25519 -C "github-actions"`
- When prompted: `/home/you/.ssh/id_ed25519 already exists. Overwrite (y/n)? y`
- You accepted and created a new key pair.

Consequences:

- Old private key → gone
- Old public key → gone
- New private key → `~/.ssh/id_ed25519`
- New public key → `~/.ssh/id_ed25519.pub`
- If you copied the new public key to the server (e.g., `ssh-copy-id root@139.59.6.209`), the server now accepts the new key but GitHub Actions still has the old private key in `SSH_PRIVATE_KEY` → deployments will fail with `Permission denied (publickey)`.

What to do now (quick, recommended)

1. Print the new private key locally:

```bash
cat ~/.ssh/id_ed25519
```

2. Update GitHub repository secret:
   - Go to GitHub → Project1 → Settings → Secrets and variables → Actions
   - Update `SSH_PRIVATE_KEY` with the full private key printed above

3. Re-run the workflow (push a small commit) to verify deployment works.

Better practice (per-project keys)

- Create distinct keys for each project:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_project1 -C "github-actions-project1"
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_project2 -C "github-actions-project2"
```

- Add the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_project1.pub root@139.59.6.209
```

- Store the matching private key in that repo's `SSH_PRIVATE_KEY` secret.

Rotation without downtime

- Add new public key to `~/.ssh/authorized_keys` on the server (keep old key).
- Update GitHub secret to new private key.
- Verify CI/CD runs.
- Remove old public key from server after successful verification.

## How to Test

### Test SSH Connection
```bash
# From your local machine
ssh root@139.59.6.209
# Should connect without password
```

### Test Workflow
1. Make a small change (add comment)
2. Commit and push to main:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → **Actions** tab
4. Watch workflow run
5. Check logs for any errors

## Workflow Status

**Green checkmark**: Deployment successful
**Red X**: Deployment failed (check logs)

## Viewing Logs

1. Go to GitHub repository
2. Click **Actions** tab
3. Click on workflow run
4. Click on **deploy** job
5. Expand steps to see logs

## Common Issues

### SSH Connection Failed
- **Problem**: Can't connect to server
- **Solutions**:
  - Verify SSH_PRIVATE_KEY secret is correct
  - Check server IP is correct
  - Verify public key is on server
  - Check firewall allows SSH (port 22)

### Git Pull Failed
- **Problem**: Can't pull code
- **Solutions**:
  - Verify repository is cloned on server
  - Check git remote is set correctly
  - Verify server has internet access

### Docker Commands Failed
- **Problem**: Docker commands error
- **Solutions**:
  - Check Docker is installed on server
  - Verify docker-compose is installed
  - Check user has Docker permissions
  - Review docker-compose.yml syntax

### Build Failed
- **Problem**: Docker build errors
- **Solutions**:
  - Check Dockerfile syntax
  - Verify all files exist
  - Check for missing dependencies
  - Review build logs

### Port Already Allocated
- **Problem**: "Bind for 0.0.0.0:3000 failed: port is already allocated"
- **Solutions**:
  - Check if another process is using the port: `lsof -i :3000`
  - Stop conflicting containers: `docker-compose down`
  - Change port in docker-compose.yml if needed
  - The concurrency configuration helps prevent this by cancelling overlapping deployments

## Security Best Practices

1. **Use SSH keys**: More secure than passwords
2. **Limit SSH access**: Use firewall rules
3. **Use non-root user**: Create dedicated user (better security)
4. **Rotate keys**: Change SSH keys periodically
5. **Monitor logs**: Check for unauthorized access

## Advanced: Using Non-Root User

**Better security approach:**

```yaml
username: deploy-user  # Instead of root
script: |
  cd /var/www/node-react-rbac
  sudo git pull origin main
  sudo docker-compose down
  # ... etc
```

**Setup on server:**
```bash
# Create user
adduser deploy-user

# Add to docker group
usermod -aG docker deploy-user

# Allow sudo without password (for specific commands)
visudo
# Add: deploy-user ALL=(ALL) NOPASSWD: /usr/bin/docker-compose
```

## Manual Deployment

If CI/CD fails, deploy manually:

```bash
ssh root@139.59.6.209
cd /var/www/node-react-rbac
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose ps
```

## Next Steps

1. Add deployment notifications (email/Slack)
2. Add health checks after deployment
3. Set up rollback strategy
4. Add staging environment
5. Implement blue-green deployment

