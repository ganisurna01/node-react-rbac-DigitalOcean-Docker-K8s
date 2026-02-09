# CI/CD Setup with GitHub Actions

This guide explains how to set up continuous deployment to Kubernetes using GitHub Actions.

## Overview

The CI/CD pipeline:
1. Builds Docker images for server and client
2. Pushes images to container registry
3. Deploys to Kubernetes cluster
4. Updates Kubernetes manifests with new image tags

## Prerequisites

1. **Container Registry**: Docker Hub, GitHub Container Registry (ghcr.io), or any compatible registry
2. **Kubernetes Cluster**: Accessible from GitHub Actions
3. **kubectl access**: Either via:
   - Direct cluster access (kubeconfig)
   - Service account with proper RBAC
   - Cloud provider credentials (GKE, EKS, AKS, DigitalOcean)

## Required GitHub Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### For Container Registry

**Option 1: Docker Hub**
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

**Option 2: GitHub Container Registry (ghcr.io)**
- `GHCR_TOKEN`: Personal Access Token with `write:packages` permission
- Username is automatically `${{ github.actor }}`

### For Kubernetes Access

**Option 1: kubeconfig file**
- `KUBE_CONFIG`: Base64 encoded kubeconfig file content

**Option 2: Service Account Token (for cloud providers)**
- `KUBE_SERVER`: Kubernetes API server URL
- `KUBE_TOKEN`: Service account token
- `KUBE_CA`: Base64 encoded CA certificate (optional)

**Option 3: DigitalOcean (if using DOKS)**
- `DIGITALOCEAN_ACCESS_TOKEN`: DO API token with read/write access

### Application Secrets

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key

## Workflow Steps Explained

### 1. Checkout Code
```yaml
- uses: actions/checkout@v3
```

### 2. Set up Docker Buildx
```yaml
- uses: docker/setup-buildx-action@v2
```
Enables multi-platform builds and caching.

### 3. Login to Registry
```yaml
- uses: docker/login-action@v2
```
Authenticates with your container registry.

### 4. Build and Push Images
```yaml
- name: Build and push server
  uses: docker/build-push-action@v4
```
Builds Docker images with tags and pushes to registry.

### 5. Deploy to Kubernetes
```yaml
- uses: azure/k8s-deploy@v4
```
Or uses kubectl directly to apply manifests.

## Image Tagging Strategy

The workflow uses:
- `latest`: Always points to the most recent build
- `${{ github.sha }}`: Git commit SHA for specific versions
- `${{ github.ref_name }}`: Branch name (main, develop, etc.)

## Deployment Process

1. **Build Phase**: Both server and client images are built in parallel
2. **Push Phase**: Images are pushed to registry
3. **Deploy Phase**: 
   - Updates deployment manifests with new image tags
   - Applies all Kubernetes manifests
   - Waits for rollout to complete

## Rollback

If deployment fails, you can rollback:

```bash
kubectl rollout undo deployment/server -n node-react-rbac
kubectl rollout undo deployment/client -n node-react-rbac
```

Or manually edit deployment to use previous image tag.

## Environment-Specific Deployments

To deploy to different environments (dev, staging, prod):

1. Create separate workflow files:
   - `.github/workflows/deploy-dev.yml`
   - `.github/workflows/deploy-prod.yml`

2. Use different namespaces:
   - `node-react-rbac-dev`
   - `node-react-rbac-prod`

3. Use different image tags or registries

## Monitoring Deployments

```bash
# Watch deployment status
kubectl rollout status deployment/server -n node-react-rbac
kubectl rollout status deployment/client -n node-react-rbac

# View deployment history
kubectl rollout history deployment/server -n node-react-rbac

# View recent events
kubectl get events -n node-react-rbac --sort-by='.lastTimestamp'
```

## Troubleshooting CI/CD

### Build fails
- Check Dockerfile syntax
- Verify build context paths
- Check registry authentication

### Push fails
- Verify registry credentials
- Check image name format
- Ensure registry permissions

### Deploy fails
- Check Kubernetes cluster access
- Verify kubectl configuration
- Check namespace exists
- Verify image pull permissions

### Pods not starting
- Check image exists in registry
- Verify image pull secrets
- Check resource limits
- Review pod logs

