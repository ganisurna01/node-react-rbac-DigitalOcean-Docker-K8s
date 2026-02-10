# Docker Compose Deployment Steps (CI/CD with GitHub Actions)

## 🎯 Global Picture

**What happens:** When you push code to GitHub, it automatically builds Docker images, pushes them to a registry, then SSH into your server and runs docker-compose to deploy.

---

## 📋 Simple Step-by-Step Overview

### **Phase 1: Setup (One-Time)**

1. **Create DigitalOcean Droplet**
   - Get a server (e.g., Ubuntu droplet)
   - Note the IP address (e.g., `139.59.6.209`)

2. **Install Docker & Docker Compose on Server**
   - SSH into droplet
   - Install Docker and Docker Compose

3. **Set Up SSH Access**
   - Generate SSH key on the droplet
   - Add public key to GitHub (Settings → SSH and GPG Keys)
   - Test connection: `ssh -T git@github.com`

4. **Clone Repository on Server**
   - Create app directory: `/var/www/node-react-rbac`
   - Clone repo using SSH: `git clone git@github.com:username/repo.git .`

5. **Add GitHub Secrets**
   - `SSH_PRIVATE_KEY` - Private SSH key from droplet (for GitHub Actions to SSH in)
   - `SERVER_HOST` - Droplet IP address (e.g., `139.59.6.209`)
   - `SERVER_USER` - SSH user (usually `root`)
   - `MONGODB_URI` - Database connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `DOCKER_USERNAME` (if using Docker Hub)
   - `DOCKER_PASSWORD` (if using Docker Hub)

6. **Create .env File on Server**
   - SSH into server
   - Create `.env` file with environment variables
   - Or use GitHub Secrets and workflow will create it

---

### **Phase 2: Automated Deployment (Every Push to Main)**

When you push code, GitHub Actions automatically:

#### **Step 1: Prepare Environment**
- ✅ Checkout your code from GitHub
- ✅ Set up Docker Buildx (for building images)
- ✅ Log in to container registry (Docker Hub or ghcr.io)

#### **Step 2: Build & Push Server Image**
- ✅ Build Docker image for Node.js backend
- ✅ Tag image (e.g., `your-registry/node-react-rbac-server:latest`)
- ✅ Push image to registry

#### **Step 3: Build & Push Client Image**
- ✅ Build Docker image for React frontend
- ✅ Tag image (e.g., `your-registry/node-react-rbac-client:latest`)
- ✅ Push image to registry

#### **Step 4: Connect to Server via SSH**
- ✅ Set up SSH connection using private key
- ✅ Connect to your droplet/server

#### **Step 5: Pull Latest Code on Server**
- ✅ Navigate to app directory: `/var/www/node-react-rbac`
- ✅ Pull latest code: `git pull origin main`

#### **Step 6: Update Environment Variables**
- ✅ Update `.env` file with latest secrets (if needed)
- ✅ Or create `.env` from GitHub Secrets

#### **Step 7: Deploy with Docker Compose**
- ✅ Stop old containers: `docker-compose down`
- ✅ Pull new images: `docker-compose pull`
- ✅ Start containers: `docker-compose up -d`
- ✅ Or use: `docker-compose up -d --build` (if building on server)

#### **Step 8: Verify Deployment**
- ✅ Check running containers: `docker-compose ps`
- ✅ Check logs: `docker-compose logs`
- ✅ Test API endpoint

---

## 🔄 What Gets Deployed

- **Server Container** - Your Node.js backend API
- **Client Container** - Your React frontend (served by Nginx)
- **Network** - Docker network connecting containers
- **Volumes** - Persistent data (if any)

---

## 🌐 How Users Access Your App

1. User types: `http://your-server-ip` or `http://your-domain.com`
2. Nginx (reverse proxy) receives request
3. Routes traffic:
   - `/api/*` → Server container (port 5000)
   - `/*` → Client container (port 80)
4. User sees your React app or gets API responses

---

## 📝 Key Files

- **`.github/workflows/deploy.yml`** - GitHub Actions workflow
- **`docker-compose.yml`** - Container orchestration config
- **`server/Dockerfile`** - Server image build instructions
- **`client/Dockerfile`** - Client image build instructions
- **`.env`** - Environment variables (on server, not in repo)

---

## 🎓 Remember

- **Images are built** → Pushed to registry → Pulled on server
- **Docker Compose manages** containers, networks, and volumes
- **Nginx reverse proxy** routes traffic to containers
- **Everything is automated** - just push code to main branch!
- **Server must be running** and accessible via SSH

---

## 🔑 Key Differences from Kubernetes

| Docker Compose | Kubernetes |
|---------------|------------|
| Single server | Cluster (multiple nodes) |
| `docker-compose` commands | `kubectl` commands |
| SSH to server | API access via kubeconfig |
| Manual scaling | Easy horizontal scaling |
| Simpler setup | More complex but powerful |

