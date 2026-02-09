# Setup Checklist

Use this checklist to ensure everything is configured correctly before deploying.

## Pre-Deployment Checklist

### Kubernetes Cluster
- [ ] Kubernetes cluster is running and accessible
- [ ] `kubectl` is installed and configured
- [ ] Can connect to cluster: `kubectl cluster-info`
- [ ] ingress-nginx is installed: `kubectl get pods -n ingress-nginx`

### Container Registry
- [ ] Container registry account created (Docker Hub, GitHub Container Registry, etc.)
- [ ] Can push images to registry
- [ ] Registry credentials are available

### Application Configuration
- [ ] MongoDB connection string ready
- [ ] JWT secret key generated
- [ ] Domain name configured (optional, can use IP)

### Kubernetes Manifests
- [ ] Updated image names in `k8s/server-deployment.yaml`
- [ ] Updated image names in `k8s/client-deployment.yaml`
- [ ] Updated domain in `k8s/ingress.yaml` (or removed host for IP access)
- [ ] Created secret: `kubectl create secret generic app-secrets ...`

### CI/CD (GitHub Actions)
- [ ] GitHub repository has Actions enabled
- [ ] Added `KUBE_CONFIG` secret (base64 encoded kubeconfig)
- [ ] Added `MONGODB_URI` secret
- [ ] Added `JWT_SECRET` secret
- [ ] Updated `REGISTRY` and `IMAGE_PREFIX` in workflow (if not using ghcr.io)
- [ ] For Docker Hub: Added `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets

## Deployment Checklist

### Manual Deployment
- [ ] Created namespace: `kubectl apply -f k8s/namespace.yaml`
- [ ] Created ConfigMap: `kubectl apply -f k8s/configmap.yaml`
- [ ] Created Secret: `kubectl apply -f k8s/secret.yaml`
- [ ] Deployed server: `kubectl apply -f k8s/server-deployment.yaml`
- [ ] Deployed client: `kubectl apply -f k8s/client-deployment.yaml`
- [ ] Deployed ingress: `kubectl apply -f k8s/ingress.yaml`

### Verification
- [ ] All pods are running: `kubectl get pods -n node-react-rbac`
- [ ] Services have endpoints: `kubectl get endpoints -n node-react-rbac`
- [ ] Ingress has external IP: `kubectl get ingress -n node-react-rbac`
- [ ] Server health check works: `curl http://<ingress-ip>/api/health`
- [ ] Frontend loads: Open `http://<ingress-ip>` in browser
- [ ] API calls work from frontend

## Post-Deployment Checklist

### Monitoring
- [ ] Checked server logs: `kubectl logs deployment/server -n node-react-rbac`
- [ ] Checked client logs: `kubectl logs deployment/client -n node-react-rbac`
- [ ] No errors in pod events: `kubectl get events -n node-react-rbac`

### DNS (if using domain)
- [ ] DNS A record points to ingress EXTERNAL-IP
- [ ] Domain resolves correctly: `nslookup your-domain.com`
- [ ] Can access via domain: `curl http://your-domain.com/api/health`

### CI/CD Verification
- [ ] Pushed code to main branch
- [ ] GitHub Actions workflow runs successfully
- [ ] Images are built and pushed to registry
- [ ] Kubernetes deployment updates automatically
- [ ] New pods are created with new images

## Troubleshooting Checklist

If something doesn't work:

- [ ] Checked pod status: `kubectl get pods -n node-react-rbac`
- [ ] Checked pod logs: `kubectl logs <pod-name> -n node-react-rbac`
- [ ] Checked service endpoints: `kubectl get endpoints -n node-react-rbac`
- [ ] Checked ingress status: `kubectl describe ingress -n node-react-rbac`
- [ ] Checked ingress-nginx controller: `kubectl get pods -n ingress-nginx`
- [ ] Verified image exists in registry
- [ ] Verified secret values are correct
- [ ] Checked resource limits (if pods are pending)

## Security Checklist

- [ ] Secret values are not committed to repository
- [ ] Using Kubernetes Secrets, not ConfigMaps for sensitive data
- [ ] Image pull secrets configured (if using private registry)
- [ ] Resource limits are set appropriately
- [ ] Network policies considered (if needed)
- [ ] RBAC permissions are minimal (for CI/CD)

## Performance Checklist

- [ ] Resource requests and limits are set
- [ ] Replica count is appropriate (2+ for HA)
- [ ] Health probes are configured correctly
- [ ] Image pull policy is appropriate (Always for latest, IfNotPresent for tagged)

## Backup and Recovery

- [ ] Know how to rollback: `kubectl rollout undo deployment/<name>`
- [ ] Have backup of Kubernetes manifests
- [ ] Have backup of secrets (stored securely)
- [ ] Know how to recreate namespace if needed

