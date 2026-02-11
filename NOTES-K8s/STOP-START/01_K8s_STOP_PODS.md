# Stop/Pause Kubernetes Deployment

## 🛑 Quick Commands to Stop Your App

Use these commands when you want to **pause/stop** your application without deleting anything. You can easily start it again later.

---

## 📋 Stop All Pods (Scale Down to Zero)

### **Option 1: Scale Down Deployments (Recommended)**

This stops all pods but keeps everything else (services, ingress, configs) intact:

```bash
# Stop server pods (scale to 0 replicas)
kubectl scale deployment server -n node-react-rbac --replicas=0

# Stop client pods (scale to 0 replicas)
kubectl scale deployment client -n node-react-rbac --replicas=0

# Verify pods are stopped
kubectl get pods -n node-react-rbac
# Should show: No resources found or pods in "Terminating" state
```

### **Option 2: Stop Both at Once**

```bash
# Stop both server and client deployments
kubectl scale deployment server client -n node-react-rbac --replicas=0
```

---

## ✅ Start Pods Again (Scale Back Up)

### **Option 1: Automatic Restart (CI/CD) - Recommended**

**Pods will automatically restart when you push code!** 🚀

When you push code to the `main` branch:
- The GitHub Actions workflow runs `kubectl apply` on your deployment files
- The deployment YAML files specify `replicas: 2`
- Kubernetes automatically scales the deployments back up to 2 replicas
- **No manual intervention needed!**

```bash
# Just push your code
git add .
git commit -m "Update application"
git push origin main

# The CI/CD pipeline will automatically:
# 1. Build new images
# 2. Deploy to Kubernetes
# 3. Scale pods back up to 2 replicas (from 0)
```

### **Option 2: Manual Start (If Needed)**

If you want to start pods manually without pushing code:

```bash
# Start server pods (scale back to 2 replicas)
kubectl scale deployment server -n node-react-rbac --replicas=2

# Start client pods (scale back to 2 replicas)
kubectl scale deployment client -n node-react-rbac --replicas=2

# Or start both at once
kubectl scale deployment server client -n node-react-rbac --replicas=2

# Verify pods are running
kubectl get pods -n node-react-rbac
# Should show pods in "Running" state
```

---

## 🔍 Check Status

```bash
# Check deployment status
kubectl get deployments -n node-react-rbac

# Check pod status
kubectl get pods -n node-react-rbac

# Check all resources
kubectl get all -n node-react-rbac
```

---

## 📝 What Happens When You Stop

- ✅ **Pods are terminated** - No containers running
- ✅ **Deployments remain** - Configuration is preserved
- ✅ **Services remain** - But no pods to route to
- ✅ **Ingress remains** - But returns 503 (Service Unavailable)
- ✅ **ConfigMaps remain** - Configuration preserved
- ✅ **Secrets remain** - Sensitive data preserved
- ✅ **Everything can be restarted** - Just scale back up

---

## 🎓 Remember

- **Stopping = Scaling to 0 replicas** - Everything stays, just no pods running
- **No data loss** - All configurations are preserved
- **Automatic restart on push** - CI/CD will scale pods back up when you deploy
- **Manual restart available** - You can also scale up manually if needed
- **Useful for:** Pausing during maintenance, saving resources, testing

---

## ⚠️ Important Notes

- **Services still exist** but won't route to anything (no pods)
- **Ingress still exists** but will return errors (503 Service Unavailable)
- **Database connections** will be lost (pods are stopped)
- **No cost savings** if using managed Kubernetes (you still pay for the cluster)
- **Storage/volumes** remain intact (if you have any)

