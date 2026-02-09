# Kubernetes Manifests Explained

This document explains each Kubernetes manifest file and its purpose.

## File Structure

```
k8s/
├── namespace.yaml           # Namespace for isolation
├── configmap.yaml           # Non-sensitive configuration
├── secret.yaml.template     # Template for sensitive data
├── server-deployment.yaml   # Server deployment + service
├── client-deployment.yaml   # Client deployment + service
└── ingress.yaml             # Ingress routing rules
```

## namespace.yaml

Creates a dedicated namespace `node-react-rbac` to isolate all application resources.

**Why?** Namespaces provide logical separation and make resource management easier.

## configmap.yaml

Stores non-sensitive configuration data:
- `NODE_ENV`: Environment (production)
- `PORT`: Server port (5000)

**Usage**: Referenced in deployments via `configMapKeyRef`.

## secret.yaml.template

Template for sensitive data. **Never commit the actual secret.yaml file!**

Contains:
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Secret key for JWT tokens

**Security**: Use `kubectl create secret` or CI/CD secrets instead of committing actual values.

## server-deployment.yaml

### Deployment

Defines the server application:
- **Replicas**: 2 (for high availability)
- **Image**: Container image for the Node.js server
- **Port**: 5000
- **Environment Variables**: From ConfigMap and Secret
- **Resources**: CPU and memory limits/requests
- **Health Checks**: 
  - Liveness probe: Checks if container is alive
  - Readiness probe: Checks if container is ready to serve traffic

### Service

Exposes the server deployment:
- **Type**: ClusterIP (internal only)
- **Port**: 5000
- **Selector**: Routes traffic to pods with `app: server` label

## client-deployment.yaml

### Deployment

Defines the client application:
- **Replicas**: 2 (for high availability)
- **Image**: Container image for the React/Nginx client
- **Port**: 80 (Nginx default)
- **Resources**: CPU and memory limits/requests
- **Health Checks**: Basic HTTP checks on root path

### Service

Exposes the client deployment:
- **Type**: ClusterIP (internal only)
- **Port**: 80
- **Selector**: Routes traffic to pods with `app: client` label

## ingress.yaml

Routes external traffic to services:
- **Class**: nginx (ingress-nginx controller)
- **Rules**:
  - `/api/*` → `server-service:5000` (backend API)
  - `/*` → `client-service:80` (frontend)

**Annotations**:
- `nginx.ingress.kubernetes.io/rewrite-target`: URL rewriting
- `nginx.ingress.kubernetes.io/ssl-redirect`: HTTPS redirect (set to false for HTTP)

## Resource Limits Explained

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

- **Requests**: Guaranteed resources (scheduler uses this)
- **Limits**: Maximum resources (container can't exceed this)
- **CPU**: 250m = 0.25 CPU cores, 500m = 0.5 CPU cores
- **Memory**: Mi = Mebibytes (1024^2 bytes)

## Health Probes

### Liveness Probe
Determines if container is running. If fails, Kubernetes restarts the container.

### Readiness Probe
Determines if container is ready to receive traffic. If fails, traffic is not sent to the pod.

**Example**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30  # Wait 30s before first check
  periodSeconds: 10         # Check every 10s
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment server -n node-react-rbac --replicas=3
```

### Horizontal Pod Autoscaler (HPA)

Create `hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: server-hpa
  namespace: node-react-rbac
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Updating Deployments

### Update Image

```bash
kubectl set image deployment/server server=your-registry/image:new-tag -n node-react-rbac
```

### Rollout Status

```bash
kubectl rollout status deployment/server -n node-react-rbac
```

### Rollback

```bash
kubectl rollout undo deployment/server -n node-react-rbac
```

## Best Practices

1. **Never commit secrets**: Use templates or CI/CD secrets
2. **Use resource limits**: Prevent resource exhaustion
3. **Health checks**: Ensure pods are healthy
4. **Multiple replicas**: High availability
5. **Labels**: Consistent labeling for selectors
6. **Namespaces**: Isolate environments
7. **Image tags**: Use specific tags, not just `latest` in production

