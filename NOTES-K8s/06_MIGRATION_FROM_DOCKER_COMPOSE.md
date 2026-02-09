# Migration from Docker Compose to Kubernetes

This document explains the differences and migration path from Docker Compose to Kubernetes.

## Key Differences

### Networking

**Docker Compose:**
- Uses a user-defined bridge network (`app-network`)
- Services communicate via service names (e.g., `http://server:5000`)

**Kubernetes:**
- Uses Services for service discovery
- Services are accessible via DNS: `<service-name>.<namespace>.svc.cluster.local`
- Client nginx no longer needs to proxy `/api` - ingress-nginx handles it

### Configuration

**Docker Compose:**
- Environment variables in `docker-compose.yml`
- `.env` file for secrets

**Kubernetes:**
- ConfigMap for non-sensitive config
- Secret for sensitive data
- Environment variables injected via ConfigMap/Secret references

### Service Discovery

**Docker Compose:**
- Service name resolves to container IP
- Client nginx proxies `/api` to `http://server:5000`

**Kubernetes:**
- Service name resolves to service IP (load balanced)
- Ingress routes `/api` to `server-service:5000`
- Client nginx only serves static files (no proxy needed)

### Scaling

**Docker Compose:**
- Manual scaling: `docker-compose up --scale server=3`
- No automatic load balancing

**Kubernetes:**
- Easy scaling: `kubectl scale deployment server --replicas=3`
- Automatic load balancing via Services
- Can use HPA for auto-scaling

### Health Checks

**Docker Compose:**
- Basic restart policies
- No built-in health checks

**Kubernetes:**
- Liveness probes (restart unhealthy pods)
- Readiness probes (remove from load balancer)
- Automatic restart on failure

## Migration Steps

### 1. Update Client Nginx Config

The client's `nginx.conf` in Docker Compose includes a proxy for `/api`. In Kubernetes, this is handled by ingress-nginx, so the client nginx only needs to serve static files.

**Docker Compose nginx.conf:**
```nginx
location /api/ {
    proxy_pass http://server:5000;
    # ... proxy settings
}
```

**Kubernetes nginx.conf:**
```nginx
# No proxy needed - ingress-nginx handles /api routing
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. Environment Variables

**Docker Compose:**
```yaml
environment:
  - MONGODB_URI=${MONGODB_URI}
  - JWT_SECRET=${JWT_SECRET}
```

**Kubernetes:**
```yaml
env:
- name: MONGODB_URI
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: MONGODB_URI
```

### 3. Port Mapping

**Docker Compose:**
```yaml
ports:
  - "${PORT:-5000}:5000"
```

**Kubernetes:**
- No port mapping needed
- Services expose ports internally
- Ingress handles external access

### 4. Dependencies

**Docker Compose:**
```yaml
depends_on:
  - server
```

**Kubernetes:**
- No explicit dependencies
- Readiness probes ensure proper startup order
- Services handle service discovery automatically

## Benefits of Kubernetes

1. **High Availability**: Multiple replicas with automatic failover
2. **Scaling**: Easy horizontal scaling
3. **Resource Management**: CPU and memory limits
4. **Health Monitoring**: Built-in health checks
5. **Rolling Updates**: Zero-downtime deployments
6. **Service Discovery**: Automatic DNS-based discovery
7. **Load Balancing**: Built-in load balancing

## Rollback Plan

If you need to rollback to Docker Compose:

1. Keep `docker-compose.yml` in repository
2. Stop Kubernetes deployment: `kubectl delete namespace node-react-rbac`
3. Deploy with Docker Compose: `docker-compose up -d`

## Common Issues During Migration

### Issue: Client can't reach server

**Docker Compose**: Client nginx proxies to `http://server:5000`
**Kubernetes**: Ingress routes `/api` to server-service

**Solution**: Ensure ingress rules are correct and ingress-nginx is installed.

### Issue: Environment variables not working

**Docker Compose**: Uses `.env` file
**Kubernetes**: Uses ConfigMap and Secret

**Solution**: Create ConfigMap and Secret, reference them in deployments.

### Issue: Port conflicts

**Docker Compose**: Maps host ports
**Kubernetes**: Uses ClusterIP services

**Solution**: No port conflicts in Kubernetes - services use cluster-internal IPs.

## Testing the Migration

1. Deploy to Kubernetes
2. Verify pods are running: `kubectl get pods -n node-react-rbac`
3. Test API: `curl http://<ingress-ip>/api/health`
4. Test frontend: Open `http://<ingress-ip>` in browser
5. Verify all functionality works as expected

