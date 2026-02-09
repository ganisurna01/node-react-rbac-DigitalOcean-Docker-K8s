# Deployment Scripts

Helper scripts for deploying and managing the Kubernetes application.

## Quick Deploy Script

Create a file `deploy-k8s.sh`:

```bash
#!/bin/bash

set -e

NAMESPACE="node-react-rbac"
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-your-username/node-react-rbac}"

echo "Deploying to Kubernetes..."
echo "Registry: $REGISTRY"
echo "Image Prefix: $IMAGE_PREFIX"

# Create namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create secret (update with your values)
kubectl create secret generic app-secrets \
  --namespace=$NAMESPACE \
  --from-literal=MONGODB_URI='your-mongodb-uri' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --dry-run=client -o yaml | kubectl apply -f -

# Update image names
sed -i.bak "s|image:.*node-react-rbac-server.*|image: ${REGISTRY}/${IMAGE_PREFIX}-server:latest|g" k8s/server-deployment.yaml
sed -i.bak "s|image:.*node-react-rbac-client.*|image: ${REGISTRY}/${IMAGE_PREFIX}-client:latest|g" k8s/client-deployment.yaml

# Apply deployments
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for rollout
kubectl rollout status deployment/server -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/client -n $NAMESPACE --timeout=5m

# Restore backups
mv k8s/server-deployment.yaml.bak k8s/server-deployment.yaml 2>/dev/null || true
mv k8s/client-deployment.yaml.bak k8s/client-deployment.yaml 2>/dev/null || true

echo "Deployment completed!"
kubectl get all -n $NAMESPACE
```

## Clean Up Script

Create a file `cleanup-k8s.sh`:

```bash
#!/bin/bash

NAMESPACE="node-react-rbac"

echo "Cleaning up Kubernetes resources..."

kubectl delete namespace $NAMESPACE

echo "Cleanup completed!"
```

## Health Check Script

Create a file `health-check.sh`:

```bash
#!/bin/bash

NAMESPACE="node-react-rbac"

echo "=== Health Check ==="
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Ingress:"
kubectl get ingress -n $NAMESPACE
echo ""
echo "Server Logs (last 10 lines):"
kubectl logs deployment/server -n $NAMESPACE --tail=10
echo ""
echo "Client Logs (last 10 lines):"
kubectl logs deployment/client -n $NAMESPACE --tail=10
```

## Usage

```bash
# Make scripts executable
chmod +x deploy-k8s.sh cleanup-k8s.sh health-check.sh

# Deploy
./deploy-k8s.sh

# Check health
./health-check.sh

# Clean up
./cleanup-k8s.sh
```

