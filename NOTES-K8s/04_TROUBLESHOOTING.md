# Troubleshooting Guide

Common issues and solutions when deploying to Kubernetes.

## Pod Issues

### Pod in Pending State

**Check**:
```bash
kubectl describe pod <pod-name> -n node-react-rbac
```

**Common causes**:
- Insufficient resources (CPU/memory)
- Node selector mismatch
- Persistent volume issues

**Solution**: Check events in describe output.

### Pod in ImagePullBackOff

**Check**:
```bash
kubectl describe pod <pod-name> -n node-react-rbac
```

**Common causes**:
- Image doesn't exist in registry
- Wrong image name/tag
- Registry authentication issues
- Private registry without imagePullSecrets

**Solution**:
1. Verify image exists: `docker pull <image-name>`
2. Check image name in deployment
3. Add imagePullSecrets if using private registry

### Pod in CrashLoopBackOff

**Check logs**:
```bash
kubectl logs <pod-name> -n node-react-rbac
kubectl logs <pod-name> -n node-react-rbac --previous  # Previous container
```

**Common causes**:
- Application errors
- Missing environment variables
- Database connection issues
- Port conflicts

**Solution**: Fix the underlying issue based on logs.

### Pod Running but Not Ready

**Check**:
```bash
kubectl describe pod <pod-name> -n node-react-rbac
```

**Common causes**:
- Readiness probe failing
- Application not responding on health check path
- Slow startup time

**Solution**:
1. Check if health endpoint works: `kubectl exec <pod-name> -n node-react-rbac -- wget -qO- http://localhost:5000/api/health`
2. Increase `initialDelaySeconds` in readiness probe
3. Verify health check path is correct

## Service Issues

### Service Has No Endpoints

**Check**:
```bash
kubectl get endpoints -n node-react-rbac
kubectl get pods -n node-react-rbac --show-labels
```

**Common causes**:
- Pod labels don't match service selector
- No pods running
- Pods not ready

**Solution**: Ensure pod labels match service selector (`app: server` or `app: client`).

### Can't Access Service

**Check**:
```bash
kubectl get svc -n node-react-rbac
kubectl describe svc <service-name> -n node-react-rbac
```

**Common causes**:
- Service type is ClusterIP (only accessible within cluster)
- Wrong port
- Firewall rules

**Solution**: Use port-forward for testing:
```bash
kubectl port-forward svc/server-service 5000:5000 -n node-react-rbac
```

## Ingress Issues

### Ingress Not Accessible

**Check**:
```bash
kubectl get ingress -n node-react-rbac
kubectl describe ingress app-ingress -n node-react-rbac
```

**Common causes**:
- ingress-nginx not installed
- ingress-nginx controller not running
- Wrong ingress class
- DNS not pointing to ingress IP

**Solution**:
1. Check ingress-nginx: `kubectl get pods -n ingress-nginx`
2. Get ingress IP: `kubectl get ingress -n node-react-rbac`
3. Point DNS to EXTERNAL-IP or use IP directly

### 502 Bad Gateway

**Check**:
```bash
kubectl get endpoints -n node-react-rbac
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

**Common causes**:
- Backend service has no endpoints
- Backend pods not ready
- Wrong service port

**Solution**: Ensure backend service has endpoints and pods are ready.

### 404 Not Found

**Check ingress rules**:
```bash
kubectl describe ingress app-ingress -n node-react-rbac
```

**Common causes**:
- Wrong path in ingress rules
- PathType mismatch
- Backend service not matching

**Solution**: Verify path rules match your application routes.

## Application Issues

### Database Connection Failed

**Check**:
```bash
kubectl logs deployment/server -n node-react-rbac
```

**Common causes**:
- Wrong MONGODB_URI in secret
- Network policies blocking connection
- Database not accessible from cluster

**Solution**:
1. Verify secret: `kubectl get secret app-secrets -n node-react-rbac -o yaml`
2. Test connection from pod: `kubectl exec -it <pod-name> -n node-react-rbac -- sh`

### API Calls Failing

**Check**:
```bash
kubectl logs deployment/client -n node-react-rbac
kubectl logs deployment/server -n node-react-rbac
```

**Common causes**:
- Wrong API URL in client build
- CORS issues
- Network routing problems

**Solution**:
1. Verify REACT_APP_API_URL build arg
2. Check CORS configuration in server
3. Verify ingress routing rules

## CI/CD Issues

### Build Fails

**Check GitHub Actions logs**

**Common causes**:
- Dockerfile errors
- Build context issues
- Registry authentication

**Solution**: Check build logs in GitHub Actions.

### Deploy Fails

**Check**:
```bash
# In GitHub Actions logs
kubectl get events -n node-react-rbac --sort-by='.lastTimestamp'
```

**Common causes**:
- Wrong kubeconfig
- Insufficient permissions
- Image pull errors
- Manifest errors

**Solution**:
1. Verify KUBE_CONFIG secret
2. Check RBAC permissions
3. Verify image exists in registry

## Debugging Commands

### General Debugging

```bash
# Get all resources
kubectl get all -n node-react-rbac

# Describe resource
kubectl describe <resource-type> <resource-name> -n node-react-rbac

# View logs
kubectl logs <pod-name> -n node-react-rbac
kubectl logs -f deployment/server -n node-react-rbac

# Execute command in pod
kubectl exec -it <pod-name> -n node-react-rbac -- sh

# Port forward for testing
kubectl port-forward svc/server-service 5000:5000 -n node-react-rbac
```

### Network Debugging

```bash
# Test service from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -n node-react-rbac -- wget -qO- http://server-service:5000/api/health

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -n node-react-rbac -- nslookup server-service
```

### Resource Debugging

```bash
# Check resource usage
kubectl top pods -n node-react-rbac
kubectl top nodes

# Check events
kubectl get events -n node-react-rbac --sort-by='.lastTimestamp'

# Check resource quotas
kubectl describe quota -n node-react-rbac
```

## Common Fixes

### Restart Deployment

```bash
kubectl rollout restart deployment/server -n node-react-rbac
kubectl rollout restart deployment/client -n node-react-rbac
```

### Delete and Recreate

```bash
kubectl delete -f k8s/server-deployment.yaml
kubectl apply -f k8s/server-deployment.yaml
```

### Force Image Pull

```bash
kubectl set image deployment/server server=<image> -n node-react-rbac
kubectl rollout restart deployment/server -n node-react-rbac
```

### Clean Up and Start Fresh

```bash
kubectl delete namespace node-react-rbac
kubectl apply -f k8s/
```

