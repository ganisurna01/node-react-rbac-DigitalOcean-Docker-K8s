# Quick Start Guide - Kubernetes Deployment

## Prerequisites Checklist

- [ ] Kubernetes cluster running (v1.20+)
- [ ] `kubectl` installed and configured
- [ ] `docker` installed (for building images)
- [ ] Container registry access (Docker Hub, GitHub Container Registry, etc.)
- [ ] ingress-nginx installed in cluster
- [ ] Domain name configured (optional, can use IP)

## 5-Minute Deployment

### 1. Install ingress-nginx (if not installed)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

### 2. Update Image Names

Edit these files and replace `your-registry` with your actual registry:
- `k8s/server-deployment.yaml` (line with `image:`)
- `k8s/client-deployment.yaml` (line with `image:`)

### 3. Create Secret

```bash
kubectl create secret generic app-secrets \
  --namespace=node-react-rbac \
  --from-literal=MONGODB_URI='your-mongodb-uri' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --dry-run=client -o yaml | kubectl apply -f -
```

Or use the template:
```bash
cp k8s/secret.yaml.template k8s/secret.yaml
# Edit secret.yaml with your values
kubectl apply -f k8s/secret.yaml
```

### 4. Deploy Everything

```bash
kubectl apply -f k8s/
```

### 5. Get Access

```bash
# Get ingress IP
kubectl get ingress -n node-react-rbac

# Or if using domain, point DNS to the EXTERNAL-IP
```

## Verify

```bash
# Check all resources
kubectl get all -n node-react-rbac

# Check pods are running
kubectl get pods -n node-react-rbac

# View logs
kubectl logs -f deployment/server -n node-react-rbac
```

## Common Issues

**Pods in ImagePullBackOff**: Update image names in deployment files
**Ingress not accessible**: Check ingress-nginx controller is running
**503 errors**: Check service endpoints: `kubectl get endpoints -n node-react-rbac`

