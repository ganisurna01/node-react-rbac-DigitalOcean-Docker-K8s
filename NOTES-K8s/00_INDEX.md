# Kubernetes Documentation Index

Complete guide to deploying Node-React-RBAC application on Kubernetes.

## Documentation Files

1. **[README.md](./README.md)** - Main overview and quick reference
   - Architecture overview
   - Quick start guide
   - Links to all documentation

2. **[01_QUICK_START.md](./01_QUICK_START.md)** - 5-minute deployment
   - Prerequisites checklist
   - Step-by-step deployment
   - Common issues

3. **[02_CI_CD_SETUP.md](./02_CI_CD_SETUP.md)** - Continuous deployment
   - GitHub Actions workflow setup
   - Required secrets
   - Deployment process
   - Troubleshooting CI/CD

4. **[03_KUBERNETES_MANIFESTS.md](./03_KUBERNETES_MANIFESTS.md)** - Manifest files explained
   - Each manifest file explained
   - Resource limits
   - Health probes
   - Scaling strategies

5. **[04_TROUBLESHOOTING.md](./04_TROUBLESHOOTING.md)** - Problem solving
   - Common issues and solutions
   - Debugging commands
   - Pod, service, and ingress issues

6. **[05_DEPLOYMENT_SCRIPT.md](./05_DEPLOYMENT_SCRIPT.md)** - Helper scripts
   - Deployment scripts
   - Cleanup scripts
   - Health check scripts

7. **[06_MIGRATION_FROM_DOCKER_COMPOSE.md](./06_MIGRATION_FROM_DOCKER_COMPOSE.md)** - Migration guide
   - Differences between Docker Compose and K8s
   - Step-by-step migration
   - Benefits of Kubernetes

8. **[07_SETUP_CHECKLIST.md](./07_SETUP_CHECKLIST.md)** - Pre-deployment checklist
   - Complete setup checklist
   - Verification steps
   - Security and performance checks

## Quick Navigation

### I want to...
- **Deploy quickly**: Start with [01_QUICK_START.md](./01_QUICK_START.md)
- **Set up CI/CD**: Read [02_CI_CD_SETUP.md](./02_CI_CD_SETUP.md)
- **Understand manifests**: See [03_KUBERNETES_MANIFESTS.md](./03_KUBERNETES_MANIFESTS.md)
- **Fix a problem**: Check [04_TROUBLESHOOTING.md](./04_TROUBLESHOOTING.md)
- **Migrate from Docker Compose**: Follow [06_MIGRATION_FROM_DOCKER_COMPOSE.md](./06_MIGRATION_FROM_DOCKER_COMPOSE.md)
- **Verify setup**: Use [07_SETUP_CHECKLIST.md](./07_SETUP_CHECKLIST.md)

## File Structure

```
k8s/
├── namespace.yaml           # Namespace definition
├── configmap.yaml           # Non-sensitive config
├── secret.yaml.template     # Secret template (DO NOT COMMIT actual secret.yaml)
├── server-deployment.yaml   # Server app deployment + service
├── client-deployment.yaml   # Client app deployment + service
└── ingress.yaml             # Ingress routing rules

NOTES-K8s/
├── 00_INDEX.md              # This file
├── README.md                # Main documentation
├── 01_QUICK_START.md        # Quick deployment
├── 02_CI_CD_SETUP.md        # CI/CD guide
├── 03_KUBERNETES_MANIFESTS.md  # Manifests explained
├── 04_TROUBLESHOOTING.md    # Troubleshooting
├── 05_DEPLOYMENT_SCRIPT.md   # Helper scripts
├── 06_MIGRATION_FROM_DOCKER_COMPOSE.md  # Migration guide
└── 07_SETUP_CHECKLIST.md    # Setup checklist
```

## Key Concepts

### Architecture
- **Namespace**: Isolates resources (`node-react-rbac`)
- **Deployments**: Manages pod replicas (2 each for server/client)
- **Services**: Exposes pods internally (ClusterIP)
- **Ingress**: Routes external traffic (ingress-nginx)
- **ConfigMap**: Non-sensitive configuration
- **Secret**: Sensitive data (MongoDB URI, JWT secret)

### Routing Flow
```
Internet → ingress-nginx → Ingress → Service → Pods
```

- `/api/*` routes to `server-service:5000`
- `/*` routes to `client-service:80`

### CI/CD Flow
```
Push to main → GitHub Actions → Build images → Push to registry → Deploy to K8s
```

## Getting Help

1. Check [04_TROUBLESHOOTING.md](./04_TROUBLESHOOTING.md) for common issues
2. Review [07_SETUP_CHECKLIST.md](./07_SETUP_CHECKLIST.md) to verify setup
3. Check Kubernetes events: `kubectl get events -n node-react-rbac`
4. View logs: `kubectl logs deployment/<name> -n node-react-rbac`

## Next Steps After Setup

1. ✅ Deploy application
2. ✅ Verify all pods are running
3. ✅ Test API and frontend
4. ✅ Set up monitoring (optional)
5. ✅ Configure SSL/TLS (optional)
6. ✅ Set up auto-scaling (optional)
7. ✅ Configure backups (optional)

