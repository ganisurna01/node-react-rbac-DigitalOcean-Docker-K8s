# Delete Everything in Kubernetes

## 🗑️ Quick Commands to Completely Remove Your App

Use these commands when you want to **permanently delete** everything. This cannot be easily undone - you'll need to redeploy.

---

## ⚠️ WARNING

**These commands will DELETE everything:**
- All pods
- All deployments
- All services
- All ingress
- All ConfigMaps
- All Secrets
- The entire namespace (if you delete the namespace)

**Make sure you have backups or can redeploy before running these commands!**

---

## 📋 Delete Everything (Multiple Options)

### **Option 1: Delete Entire Namespace (Easiest - Deletes Everything)**

This is the **fastest way** to delete everything in one command:

```bash
# Delete the entire namespace (this deletes EVERYTHING inside it)
kubectl delete namespace node-react-rbac

# Verify deletion
kubectl get namespace node-react-rbac
# Should show: Error from server (NotFound): namespaces "node-react-rbac" not found
```

**What gets deleted:**
- ✅ All pods
- ✅ All deployments
- ✅ All services
- ✅ All ingress
- ✅ All ConfigMaps
- ✅ All Secrets
- ✅ The namespace itself

**To recreate later:**
```bash
# Create namespace again
kubectl create namespace node-react-rbac

# Then redeploy everything
kubectl apply -f k8s/
```

---

### **Option 2: Delete Individual Resources (More Control)**

If you want to delete specific resources but keep others:

```bash
# Delete deployments (this also deletes pods)
kubectl delete deployment server client -n node-react-rbac

# Delete services
kubectl delete service server-service client-service -n node-react-rbac

# Delete ingress
kubectl delete ingress app-ingress -n node-react-rbac

# Delete ConfigMap
kubectl delete configmap app-config -n node-react-rbac

# Delete Secret
kubectl delete secret app-secrets -n node-react-rbac

# Verify everything is deleted
kubectl get all -n node-react-rbac
# Should show: No resources found
```

---

### **Option 3: Delete Using Manifest Files**

If you have all your manifests in the `k8s/` directory:

```bash
# Delete everything defined in k8s/ directory
kubectl delete -f k8s/

# This will delete:
# - server-deployment.yaml
# - client-deployment.yaml
# - ingress.yaml
# - configmap.yaml
# - secret.yaml (if it exists)
```

**Note:** This won't delete the namespace itself, only resources inside it.

---

### **Option 4: Delete Everything in Namespace (Keep Namespace)**

Delete all resources but keep the namespace:

```bash
# Delete all deployments
kubectl delete deployment --all -n node-react-rbac

# Delete all services
kubectl delete service --all -n node-react-rbac

# Delete all ingress
kubectl delete ingress --all -n node-react-rbac

# Delete all ConfigMaps
kubectl delete configmap --all -n node-react-rbac

# Delete all Secrets
kubectl delete secret --all -n node-react-rbac

# Or delete all resources of all types at once
kubectl delete all --all -n node-react-rbac
```

---

## 🔍 Verify Deletion

```bash
# Check if namespace exists
kubectl get namespace node-react-rbac

# Check all resources in namespace
kubectl get all -n node-react-rbac

# Check specific resources
kubectl get deployments -n node-react-rbac
kubectl get services -n node-react-rbac
kubectl get ingress -n node-react-rbac
kubectl get pods -n node-react-rbac
```

---

## 🔄 Redeploy After Deletion

If you deleted everything and want to redeploy:

```bash
# 1. Create namespace (if you deleted it)
kubectl create namespace node-react-rbac

# 2. Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# 3. Create Secret (from GitHub Secrets or manually)
kubectl create secret generic app-secrets \
  --namespace=node-react-rbac \
  --from-literal=MONGODB_URI='your-mongodb-uri' \
  --from-literal=JWT_SECRET='your-jwt-secret'

# 4. Deploy everything
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Or apply all at once
kubectl apply -f k8s/
```

---

## 📝 What Gets Deleted vs What Stays

### **When You Delete Namespace:**
- ❌ Everything inside the namespace
- ❌ The namespace itself
- ✅ **Images in registry** - Still exist (not deleted)
- ✅ **GitHub repository** - Still exists
- ✅ **GitHub Secrets** - Still exist
- ✅ **Kubernetes cluster** - Still exists

### **When You Delete Individual Resources:**
- ❌ Only the specific resources you delete
- ✅ **Namespace** - Still exists
- ✅ **Other resources** - Still exist (if you didn't delete them)
- ✅ **Images in registry** - Still exist

---

## 🎓 Remember

- **Deleting namespace = Delete everything** - Fastest way
- **Deleting individual resources = More control** - Selective deletion
- **Images are NOT deleted** - They stay in your registry
- **Can always redeploy** - Using same manifests and images
- **Useful for:** Clean slate, testing, removing old deployments

---

## ⚠️ Important Notes

- **Permanent deletion** - Cannot be undone easily
- **Data loss** - Any data in pods will be lost (unless using persistent volumes)
- **No automatic backup** - Make sure you have backups if needed
- **Redeploy required** - You'll need to run `kubectl apply` again to restore
- **Images remain** - Docker images in registry are not deleted

---

## 🆚 Stop vs Delete

| Action | Command | What Happens | Can Restart? |
|--------|---------|--------------|--------------|
| **Stop** | `kubectl scale ... --replicas=0` | Pods stop, configs remain | ✅ Yes, just scale up |
| **Delete** | `kubectl delete namespace ...` | Everything removed | ❌ No, must redeploy |

**Use STOP when:** You want to pause temporarily, save resources, do maintenance  
**Use DELETE when:** You want a clean slate, remove everything, start fresh

