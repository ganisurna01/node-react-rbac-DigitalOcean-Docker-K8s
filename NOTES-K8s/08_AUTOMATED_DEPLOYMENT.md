# Automated Deployment Guide (CI/CD with GitHub Actions for Kubernetes)

This guide explains how to set up automated deployment using GitHub Actions for Kubernetes. Once configured, every push to the main branch will automatically build Docker images, push them to a registry, and deploy to your Kubernetes cluster.

## Prerequisites

1. **Kubernetes Cluster** - Running and accessible (DigitalOcean Kubernetes, GKE, EKS, AKS, or self-hosted)
2. **kubectl** - Installed and configured to access your cluster
3. **Container Registry** - Docker Hub, GitHub Container Registry (ghcr.io), or any compatible registry
4. **ingress-nginx** - Installed in your Kubernetes cluster
5. **GitHub Repository** - With push access
6. **Domain Name** (optional) - Can use IP address if no domain

## Step 1: Set Up Kubernetes Cluster Access

### 1.1 Get Your Kubeconfig File

You need to get your kubeconfig file to allow GitHub Actions to access your cluster.

#### For DigitalOcean Kubernetes (DOKS):

```bash
# Install doctl (DigitalOcean CLI)
# On Windows: Download from https://github.com/digitalocean/doctl/releases
# Or use WSL/Linux:

# Download doctl
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate
doctl auth init
# Enter your DigitalOcean API token when prompted

# List clusters
doctl kubernetes cluster list

# Get kubeconfig for your cluster
doctl kubernetes cluster kubeconfig save YOUR_CLUSTER_NAME
```

#### For Other Cloud Providers:

**Google Cloud (GKE):**
```bash
gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID
```

**AWS (EKS):**
```bash
aws eks update-kubeconfig --name CLUSTER_NAME --region REGION
```

**Azure (AKS):**
```bash
az aks get-credentials --resource-group RESOURCE_GROUP --name CLUSTER_NAME
```

### 1.2 Verify Cluster Access

```bash
# Test kubectl connection
kubectl cluster-info

# Should show your cluster information
# Example: Kubernetes control plane is running at https://xxx.xxx.xxx.xxx:6443
```

### 1.3 Install ingress-nginx (if not installed)

```bash
# Install ingress-nginx
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Verify installation
kubectl get pods -n ingress-nginx
```

## Step 2: Prepare Kubeconfig for GitHub Actions

### 2.1 Get Your Kubeconfig Content

```bash
# On your local machine (where kubectl is configured)
# Get the kubeconfig file location
echo $KUBECONFIG
# Or default location: ~/.kube/config

# Read the kubeconfig file
cat ~/.kube/config

# Or on Windows (PowerShell):
Get-Content $env:USERPROFILE\.kube\config

# Copy the ENTIRE output (starts with apiVersion: ...)
```

**Important:** The kubeconfig file contains:
- Cluster certificate authority (CA)
- Cluster server URL
- User credentials (token or certificate)

### 2.2 Encode Kubeconfig to Base64 (Optional but Recommended)

```bash
# On Linux/WSL:
cat ~/.kube/config | base64 -w 0

# On Windows (PowerShell):
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content $env:USERPROFILE\.kube\config -Raw)))

# Copy the base64 encoded string
```

**Why Base64?** Makes it easier to paste into GitHub Secrets without formatting issues.

## Step 3: Set Up Container Registry

### Option A: GitHub Container Registry (ghcr.io) - Recommended

**Advantages:**
- Free for public repositories
- Integrated with GitHub
- No additional setup needed
- Uses `GITHUB_TOKEN` automatically

**No setup needed!** The workflow is already configured to use ghcr.io.

### Option B: Docker Hub

1. **Create Docker Hub account** (if you don't have one): https://hub.docker.com
2. **Get your credentials:**
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password or access token

### Option C: Other Registries

Update the workflow file to use your registry URL and authentication method.

## Step 4: Add GitHub Secrets

### 4.1 Access GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 4.2 Required Secrets

#### Secret 1: KUBE_CONFIG

1. **Name:** `KUBE_CONFIG`
2. **Value:** 
   - **Option A:** Paste the entire kubeconfig file content (if not base64 encoded)
   - **Option B:** Paste the base64 encoded kubeconfig (if you encoded it)
3. Click **Add secret**

**Important:**
- Include the ENTIRE kubeconfig file content
- If using base64, the workflow will decode it automatically
- Never commit kubeconfig to the repository

#### Secret 2: MONGODB_URI

1. **Name:** `MONGODB_URI`
2. **Value:** Your MongoDB connection string
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```
3. Click **Add secret**

#### Secret 3: JWT_SECRET

1. **Name:** `JWT_SECRET`
2. **Value:** Your JWT secret key (any secure random string)
3. Click **Add secret**

#### Secret 4: Docker Hub Credentials (Only if using Docker Hub)

If you're using Docker Hub instead of ghcr.io:

1. **Name:** `DOCKER_USERNAME`
2. **Value:** Your Docker Hub username
3. Click **Add secret**

4. **Name:** `DOCKER_PASSWORD`
5. **Value:** Your Docker Hub password or access token
6. Click **Add secret**

### 4.3 Verify Secrets

You should have these secrets:
- ✅ `KUBE_CONFIG` - Kubernetes cluster access
- ✅ `MONGODB_URI` - Database connection
- ✅ `JWT_SECRET` - JWT signing key
- ✅ `DOCKER_USERNAME` (optional) - Only if using Docker Hub
- ✅ `DOCKER_PASSWORD` (optional) - Only if using Docker Hub

## Step 5: Configure Workflow File

### 5.1 Update Registry Settings (if needed)

The workflow file (`.github/workflows/deploy.yml`) is already configured for GitHub Container Registry. If you want to use Docker Hub:

1. Open `.github/workflows/deploy.yml`
2. Find the `env` section at the top
3. Update:
   ```yaml
   env:
     REGISTRY: docker.io  # Change from ghcr.io
     IMAGE_PREFIX: your-dockerhub-username/node-react-rbac
   ```
4. Uncomment Docker Hub login section and comment out ghcr.io section

### 5.2 Update Image Names in Deployment Files

The workflow automatically updates image names, but you can set default values:

1. Open `k8s/server-deployment.yaml`
2. Find the `image:` line
3. Update to your registry path (workflow will override this, but good for manual deployment)

4. Open `k8s/client-deployment.yaml`
5. Do the same

### 5.3 Update Ingress Domain (Optional)

1. Open `k8s/ingress.yaml`
2. Find the `host:` field
3. Update to your domain name, or remove the host field to use IP

## Step 6: Initial Manual Deployment (Optional)

Before setting up CI/CD, you can test manual deployment:

### 6.1 Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 6.2 Create ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### 6.3 Create Secret

```bash
kubectl create secret generic app-secrets \
  --namespace=node-react-rbac \
  --from-literal=MONGODB_URI='your-mongodb-uri' \
  --from-literal=JWT_SECRET='your-jwt-secret'
```

### 6.4 Build and Push Images Manually

```bash
# Build server image
cd server
docker build -t your-registry/node-react-rbac-server:latest .
docker push your-registry/node-react-rbac-server:latest

# Build client image
cd ../client
docker build -t your-registry/node-react-rbac-client:latest --build-arg REACT_APP_API_URL=/api .
docker push your-registry/node-react-rbac-client:latest
```

### 6.5 Update and Deploy

```bash
# Update image names in deployment files
sed -i "s|image:.*|image: your-registry/node-react-rbac-server:latest|g" k8s/server-deployment.yaml
sed -i "s|image:.*|image: your-registry/node-react-rbac-client:latest|g" k8s/client-deployment.yaml

# Deploy
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### 6.6 Verify

```bash
# Check pods
kubectl get pods -n node-react-rbac

# Check services
kubectl get svc -n node-react-rbac

# Get ingress IP
kubectl get ingress -n node-react-rbac
```

## Step 7: Test Automated Deployment

### 7.1 Make a Test Change

```bash
# Make a small change (add a comment to any file)
# Example: Add a comment to README.md

git add .
git commit -m "Test Kubernetes CI/CD deployment"
git push origin main
```

### 7.2 Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see "Deploy to Kubernetes" workflow running
4. Click on it to see detailed logs
5. Watch the progress:
   - ✅ Checkout code
   - ✅ Set up Docker Buildx
   - ✅ Log in to registry
   - ✅ Build and push server image
   - ✅ Build and push client image
   - ✅ Set up kubectl
   - ✅ Configure kubectl
   - ✅ Update deployment images
   - ✅ Create namespace
   - ✅ Create/Update ConfigMap
   - ✅ Create/Update Secret
   - ✅ Deploy to Kubernetes
   - ✅ Wait for rollout
   - ✅ Verify deployment

### 7.3 Verify Deployment Success

After workflow completes:

```bash
# Check pods are running
kubectl get pods -n node-react-rbac

# Should show 2 server pods and 2 client pods all in "Running" state

# Get ingress IP
kubectl get ingress -n node-react-rbac

# Test API
curl http://<INGRESS_IP>/api/health
# Should return: {"message":"Server is running!"}

# Access frontend
# Open browser: http://<INGRESS_IP>
```

## How Automated Deployment Works

### Workflow Process

When you push code to `main` branch:

1. **GitHub detects push** → Triggers workflow
2. **Workflow starts** → Runs on Ubuntu runner
3. **Checkout code** → Downloads repository
4. **Set up Docker Buildx** → Enables advanced Docker features
5. **Log in to registry** → Authenticates with container registry
6. **Build server image** → Builds Node.js backend Docker image
7. **Push server image** → Uploads to registry
8. **Build client image** → Builds React frontend Docker image
9. **Push client image** → Uploads to registry
10. **Set up kubectl** → Installs kubectl in workflow
11. **Configure kubectl** → Sets up cluster access using KUBE_CONFIG
12. **Update deployment images** → Updates image names in YAML files
13. **Create namespace** → Creates `node-react-rbac` namespace if needed
14. **Create/Update ConfigMap** → Applies configuration
15. **Create/Update Secret** → Applies secrets from GitHub Secrets
16. **Deploy to Kubernetes** → Applies all deployment manifests
17. **Wait for rollout** → Ensures pods are ready
18. **Verify deployment** → Shows deployment status

### What Gets Deployed

- **Server (Backend)**: Node.js Express API (2 replicas)
- **Client (Frontend)**: React app served by Nginx (2 replicas)
- **Services**: ClusterIP services for internal communication
- **Ingress**: Routes external traffic to services
- **ConfigMap**: Non-sensitive configuration
- **Secret**: Sensitive data (MongoDB URI, JWT secret)

### Image Tagging Strategy

The workflow tags images with:
- `latest` - Always points to most recent build (on main branch)
- `main-<sha>` - Specific commit SHA for traceability
- `main` - Branch name tag

## Step 8: Verify Deployment

### 8.1 Check Pod Status

```bash
kubectl get pods -n node-react-rbac

# Should show:
# NAME                      READY   STATUS    RESTARTS   AGE
# server-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# server-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# client-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
# client-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
```

### 8.2 Check Services

```bash
kubectl get svc -n node-react-rbac

# Should show:
# NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
# server-service   ClusterIP   10.xxx.xxx.xxx  <none>        5000/TCP   2m
# client-service   ClusterIP   10.xxx.xxx.xxx  <none>        80/TCP     2m
```

### 8.3 Check Ingress

```bash
kubectl get ingress -n node-react-rbac

# Should show:
# NAME          CLASS   HOSTS                ADDRESS        PORTS   AGE
# app-ingress  nginx    nodereactrback8s.com  xxx.xxx.xxx.xxx  80      2m
```

### 8.4 Test Application

```bash
# Test API health endpoint
curl http://<INGRESS_IP>/api/health
# Or if using domain:
curl http://nodereactrback8s.com/api/health

# Should return: {"message":"Server is running!"}

# Access frontend in browser
# http://<INGRESS_IP>
# Or: http://nodereactrback8s.com
```

### 8.5 Check Logs

```bash
# Server logs
kubectl logs -f deployment/server -n node-react-rbac

# Client logs
kubectl logs -f deployment/client -n node-react-rbac
```

## Troubleshooting Automated Deployment

### Workflow Fails: kubectl Authentication Failed

**Problem:** Can't connect to Kubernetes cluster

**Solutions:**
- Verify `KUBE_CONFIG` secret is correct
- Check you copied the ENTIRE kubeconfig file
- Verify kubeconfig is valid: `kubectl cluster-info` (on your local machine)
- Check cluster is accessible from internet (for cloud providers)
- Verify cluster credentials haven't expired
- For base64 encoded: Ensure it's properly encoded

### Workflow Fails: Image Build Failed

**Problem:** Docker build fails

**Solutions:**
- Check Dockerfile syntax
- Verify build context paths are correct
- Check for missing files in build context
- Review build logs in GitHub Actions
- Test build locally: `docker build -t test ./server`

### Workflow Fails: Image Push Failed

**Problem:** Can't push to registry

**Solutions:**
- Verify registry credentials (Docker Hub username/password)
- Check registry permissions
- Verify image name format is correct
- For ghcr.io: Ensure `GITHUB_TOKEN` has package write permissions
- Check registry quota/limits

### Workflow Fails: Deployment Failed

**Problem:** kubectl apply fails

**Solutions:**
- Check YAML syntax: `kubectl apply --dry-run=client -f k8s/server-deployment.yaml`
- Verify namespace exists
- Check RBAC permissions (service account needs deploy permissions)
- Review error message in workflow logs
- Verify image exists in registry

### Workflow Succeeds but Pods Not Starting

**Problem:** Deployment completes but pods are in Error/CrashLoopBackOff

**Solutions:**
- Check pod logs: `kubectl logs <pod-name> -n node-react-rbac`
- Check pod events: `kubectl describe pod <pod-name> -n node-react-rbac`
- Verify image exists and is accessible: `kubectl describe pod <pod-name> -n node-react-rbac`
- Check resource limits (pods might be pending)
- Verify secrets are correct: `kubectl get secret app-secrets -n node-react-rbac -o yaml`
- Check MongoDB connection
- Verify environment variables

### Workflow Succeeds but App Not Accessible

**Problem:** Pods running but can't access via ingress

**Solutions:**
- Check ingress status: `kubectl describe ingress app-ingress -n node-react-rbac`
- Verify ingress-nginx controller is running: `kubectl get pods -n ingress-nginx`
- Check ingress IP: `kubectl get ingress -n node-react-rbac`
- Verify DNS points to ingress IP (if using domain)
- Check service endpoints: `kubectl get endpoints -n node-react-rbac`
- Test service directly: `kubectl port-forward svc/server-service 5000:5000 -n node-react-rbac`

### ImagePullBackOff Error

**Problem:** Pods can't pull images

**Solutions:**
- Verify image exists in registry
- Check image name in deployment matches registry
- Verify registry is accessible from cluster
- For private registries: Add imagePullSecrets to deployment
- Check network policies (if any)

## Manual Override

If automated deployment fails, you can deploy manually:

```bash
# Build and push images
cd server && docker build -t your-registry/node-react-rbac-server:latest . && docker push your-registry/node-react-rbac-server:latest
cd ../client && docker build -t your-registry/node-react-rbac-client:latest --build-arg REACT_APP_API_URL=/api . && docker push your-registry/node-react-rbac-client:latest

# Update deployments
sed -i "s|image:.*|image: your-registry/node-react-rbac-server:latest|g" k8s/server-deployment.yaml
sed -i "s|image:.*|image: your-registry/node-react-rbac-client:latest|g" k8s/client-deployment.yaml

# Deploy
kubectl apply -f k8s/
```

## Updating Configuration

### Update Environment Variables

Environment variables are stored in:
- **ConfigMap** (non-sensitive): `k8s/configmap.yaml`
- **Secret** (sensitive): GitHub Secrets

To update:

1. **ConfigMap values:**
   - Edit `k8s/configmap.yaml`
   - Commit and push (workflow will apply it)

2. **Secret values:**
   - Update GitHub Secrets
   - Workflow will recreate secret on next deployment
   - Or manually: `kubectl create secret generic app-secrets ... --dry-run=client -o yaml | kubectl apply -f -`

### Update Image Versions

The workflow automatically uses `latest` tag. To use a specific version:

1. Edit deployment files to use specific tag
2. Or modify workflow to use different tagging strategy

### Update Replica Count

Edit `k8s/server-deployment.yaml` and `k8s/client-deployment.yaml`:
```yaml
spec:
  replicas: 3  # Change from 2 to 3
```

Commit and push - workflow will apply the change.

## Workflow File Location

The automated deployment workflow is configured in:
```
.github/workflows/deploy.yml
```

You can customize it if needed, but the default configuration should work for most cases.

## Security Best Practices

1. ✅ **Never commit kubeconfig** - Always use GitHub Secrets
2. ✅ **Rotate credentials** - Change secrets periodically
3. ✅ **Use least privilege** - Service account with minimal permissions
4. ✅ **Monitor Actions logs** - Check for unauthorized access
5. ✅ **Use private registries** - For production images
6. ✅ **Enable branch protection** - Require reviews before merging to main
7. ✅ **Use specific image tags** - Avoid `latest` in production (consider updating workflow)

## Benefits of Automated Kubernetes Deployment

- ✅ **No manual steps** - Push code, deployment happens automatically
- ✅ **Consistent deployments** - Same process every time
- ✅ **Faster updates** - No need to manually build and deploy
- ✅ **Rolling updates** - Zero-downtime deployments
- ✅ **Easy rollback** - `kubectl rollout undo deployment/server -n node-react-rbac`
- ✅ **Deployment history** - See all deployments in GitHub Actions
- ✅ **Error visibility** - Logs show exactly what went wrong
- ✅ **Scalability** - Easy to scale replicas
- ✅ **High availability** - Multiple replicas with automatic failover

## Differences from Docker Compose CI/CD

| Docker Compose | Kubernetes |
|----------------|------------|
| SSH to server | kubectl apply |
| docker-compose commands | kubectl commands |
| Single server | Cluster (multiple nodes) |
| Manual scaling | Easy horizontal scaling |
| No health checks | Built-in probes |
| Port mapping | Services + Ingress |
| .env file | ConfigMap + Secret |

## Next Steps

1. ✅ Set up deployment notifications (email/Slack)
2. ✅ Add health checks after deployment
3. ✅ Set up staging environment
4. ✅ Implement rollback strategy
5. ✅ Add deployment status badges to README
6. ✅ Set up monitoring (Prometheus, Grafana)
7. ✅ Configure SSL/TLS with cert-manager
8. ✅ Set up auto-scaling (HPA)
9. ✅ Configure resource quotas
10. ✅ Set up backup strategies

## Quick Reference Commands

```bash
# Check deployment status
kubectl get all -n node-react-rbac

# View logs
kubectl logs -f deployment/server -n node-react-rbac

# Check ingress
kubectl get ingress -n node-react-rbac

# Rollback deployment
kubectl rollout undo deployment/server -n node-react-rbac

# Scale deployment
kubectl scale deployment server -n node-react-rbac --replicas=3

# Delete everything
kubectl delete namespace node-react-rbac
```

