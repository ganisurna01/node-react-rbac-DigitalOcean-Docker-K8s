# Kubernetes Deployment Steps (CI/CD with GitHub Actions)

## 🎯 Global Picture

**What happens:** When you push code to GitHub, it automatically builds Docker images, pushes them to a registry, and deploys to your Kubernetes cluster.

---

## 📋 Simple Step-by-Step Overview

### **Phase 1: Setup (One-Time)**

1. **Create Kubernetes Cluster**
   - Set up a cluster (e.g., DigitalOcean Kubernetes)
   - Get kubeconfig file for cluster access

2. **Install doctl (DigitalOcean CLI)**
   - Needed to authenticate with DigitalOcean cluster
   - Get DigitalOcean API token

3. **Add GitHub Secrets**
   - `KUBE_CONFIG` - Your raw kubeconfig file content (not base64)
   - `DIGITALOCEAN_ACCESS_TOKEN` - DigitalOcean API token for doctl
   - `MONGODB_URI` - Database connection string
   - `JWT_SECRET` - Secret key for JWT tokens

4. **Configure Ingress**
   - Set domain name in `k8s/ingress.yaml` (e.g., `nodereactrback8s.com`)
   - Map domain to ingress IP in your hosts file

---

### **Phase 2: Automated Deployment (Every Push to Main)**

When you push code, GitHub Actions automatically:

#### **Step 1: Prepare Environment**
- ✅ Checkout your code from GitHub
- ✅ Set up Docker Buildx (for building images)
- ✅ Log in to container registry (ghcr.io or Docker Hub)

#### **Step 2: Build & Push Server Image**
- ✅ Extract metadata (tags, labels) for server image
- ✅ Build Docker image for Node.js backend
- ✅ Push image to registry (e.g., `ghcr.io/username/node-react-rbac-server:latest`)

#### **Step 3: Build & Push Client Image**
- ✅ Extract metadata (tags, labels) for client image
- ✅ Build Docker image for React frontend
- ✅ Push image to registry (e.g., `ghcr.io/username/node-react-rbac-client:latest`)

#### **Step 4: Set Up Kubernetes Access**
- ✅ Install kubectl (Kubernetes command-line tool)
- ✅ Install doctl (DigitalOcean CLI) and authenticate
- ✅ Configure kubectl to access your cluster using kubeconfig

#### **Step 5: Update Deployment Files**
- ✅ Update `k8s/server-deployment.yaml` with new server image
- ✅ Update `k8s/client-deployment.yaml` with new client image

#### **Step 6: Deploy to Kubernetes**
- ✅ Create namespace if it doesn't exist (`node-react-rbac`)
- ✅ Create/Update ConfigMap (non-sensitive config)
- ✅ Create/Update Secret (sensitive data like MongoDB URI, JWT secret)
- ✅ Apply server deployment (creates pods, service)
- ✅ Apply client deployment (creates pods, service)
- ✅ Apply ingress (routes traffic from internet to services)

#### **Step 7: Verify Deployment**
- ✅ Wait for pods to be ready (health checks)
- ✅ Check deployment status
- ✅ Verify ingress is working

---

## 🔄 What Gets Deployed

- **Server Pods** (2 replicas) - Your Node.js backend API
- **Client Pods** (2 replicas) - Your React frontend
- **Services** - Internal networking between pods
- **Ingress** - Routes external traffic to your services
- **ConfigMap** - Application configuration
- **Secret** - Sensitive data (database, tokens)

---

## 🌐 How Users Access Your App

1. User types: `http://nodereactrback8s.com`
2. DNS/hosts file resolves to ingress IP: `165.245.144.226`
3. Ingress receives request and routes:
   - `/api/*` → Server service → Server pods
   - `/*` → Client service → Client pods
4. User sees your React app or gets API responses

---

## 📝 Key Files

- **`.github/workflows/deploy.yml`** - GitHub Actions workflow
- **`k8s/server-deployment.yaml`** - Server deployment config
- **`k8s/client-deployment.yaml`** - Client deployment config
- **`k8s/ingress.yaml`** - Traffic routing config
- **`k8s/configmap.yaml`** - Application settings
- **`k8s/secret.yaml.template`** - Secret template (not committed)

---

## 🎓 Remember

- **Images are built** → Pushed to registry → Pulled by Kubernetes
- **Kubernetes manages** pods, services, and networking
- **Ingress routes** external traffic to your services
- **Everything is automated** - just push code to main branch!

