# Delete Everything in Docker Compose

## 🗑️ Quick Commands to Completely Remove Your App

Use these commands when you want to **permanently delete** everything. This cannot be easily undone - you'll need to redeploy.

---

## ⚠️ WARNING

**These commands will DELETE everything:**
- All containers
- All images (if using `--rmi` flag)
- All volumes (if using `-v` flag)
- All networks
- All data in volumes

**Make sure you have backups or can redeploy before running these commands!**

---

## 📋 Delete Everything (Multiple Options)

### **Option 1: Delete Containers, Networks, and Volumes (Recommended)**

This is the **most common way** to clean up everything:

```bash
# SSH to your server
ssh root@139.59.6.209

# Navigate to project directory
cd /var/www/node-react-rbac

# Stop and remove containers, networks, and volumes
docker-compose down -v

# Verify deletion
docker-compose ps
# Should show: No resources found
```

**What gets deleted:**
- ✅ All containers (stopped and running)
- ✅ All networks created by docker-compose
- ✅ All volumes (data will be lost!)
- ❌ Images remain (not deleted by default)
- ❌ Configuration files remain (docker-compose.yml, .env)

**Flags explained:**
- `down` - Stops and removes containers and networks
- `-v` or `--volumes` - Also removes volumes (deletes data!)

### **Option 2: Delete Everything Including Images**

If you also want to remove Docker images:

```bash
# Stop and remove everything including images
docker-compose down -v --rmi all

# Or remove only local images (not pulled from registry)
docker-compose down -v --rmi local
```

**What gets deleted:**
- ✅ All containers
- ✅ All networks
- ✅ All volumes
- ✅ All images (built locally or pulled)
- ❌ Configuration files remain

**Flag options:**
- `--rmi all` - Remove all images used by services
- `--rmi local` - Remove only images that don't have a tag

### **Option 3: Delete Containers Only (Keep Volumes)**

If you want to keep your data (volumes):

```bash
# Stop and remove containers and networks only
docker-compose down

# Volumes are NOT deleted
# Data is preserved
```

**What gets deleted:**
- ✅ All containers
- ✅ All networks
- ❌ Volumes remain (data preserved)
- ❌ Images remain
- ❌ Configuration files remain

### **Option 4: Delete Specific Service**

If you want to delete only one service:

```bash
# Stop and remove only server
docker-compose rm -f -s -v server

# Stop and remove only client
docker-compose rm -f -s -v client
```

**Flags explained:**
- `rm` - Remove containers
- `-f` - Force (don't ask for confirmation)
- `-s` - Stop containers before removing
- `-v` - Remove volumes associated with containers

### **Option 5: Nuclear Option - Delete Everything Docker-Related**

**⚠️ EXTREME WARNING: This deletes ALL Docker containers, images, volumes, and networks on your server!**

```bash
# Delete ALL Docker resources (not just this project)
docker system prune -a --volumes

# This will delete:
# - All stopped containers
# - All unused images
# - All unused volumes
# - All unused networks
```

**Only use this if:**
- You want to completely clean your server
- You're sure you don't need any Docker resources
- You're okay with losing everything

---

## 🔍 Verify Deletion

```bash
# Check if containers exist
docker-compose ps

# Check all Docker containers
docker ps -a

# Check Docker images
docker images

# Check Docker volumes
docker volume ls

# Check Docker networks
docker network ls

# Check project-specific resources
docker-compose config
```

---

## 🔄 Redeploy After Deletion

If you deleted everything and want to redeploy:

### **Option 1: Automatic Redeploy (CI/CD)**

**Just push your code!** The CI/CD pipeline will automatically:
1. Pull latest code
2. Build new images
3. Create and start new containers

```bash
# Just push your code
git add .
git commit -m "Redeploy application"
git push origin main

# The workflow will automatically:
# 1. Pull code
# 2. docker-compose build --no-cache
# 3. docker-compose up -d
```

### **Option 2: Manual Redeploy**

If you want to redeploy manually:

```bash
# SSH to server
ssh root@139.59.6.209

# Navigate to project directory
cd /var/www/node-react-rbac

# Pull latest code (if needed)
git pull origin main

# Build images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Verify
docker-compose ps
```

---

## 📝 What Gets Deleted vs What Stays

### **When You Use `docker-compose down -v`:**
- ❌ All containers
- ❌ All networks
- ❌ All volumes (data lost!)
- ✅ **Images** - Still exist (not deleted)
- ✅ **Configuration files** - docker-compose.yml, .env remain
- ✅ **Git repository** - Code remains
- ✅ **Server** - Still exists

### **When You Use `docker-compose down -v --rmi all`:**
- ❌ All containers
- ❌ All networks
- ❌ All volumes
- ❌ All images
- ✅ **Configuration files** - docker-compose.yml, .env remain
- ✅ **Git repository** - Code remains
- ✅ **Server** - Still exists

### **When You Use `docker-compose down` (no flags):**
- ❌ All containers
- ❌ All networks
- ✅ **Volumes** - Still exist (data preserved)
- ✅ **Images** - Still exist
- ✅ **Configuration files** - Remain
- ✅ **Everything else** - Remains

---

## 🎓 Remember

- **Deleting with `-v` = Data loss** - Volumes are removed
- **Deleting with `--rmi` = Image loss** - Images are removed
- **Images are NOT deleted by default** - They stay on disk
- **Can always redeploy** - Using same docker-compose.yml and code
- **Useful for:** Clean slate, testing, removing old deployments, freeing disk space

---

## ⚠️ Important Notes

- **Permanent deletion** - Cannot be undone easily
- **Data loss** - Volumes are deleted (unless you skip `-v` flag)
- **No automatic backup** - Make sure you have backups if needed
- **Redeploy required** - You'll need to run `docker-compose up -d` again
- **Images remain** - Docker images stay on disk (unless using `--rmi`)
- **Configuration files remain** - docker-compose.yml and .env are not deleted

---

## 💾 About Volumes

**Volumes store persistent data:**
- Database data
- Uploaded files
- Logs (if stored in volumes)
- Any persistent storage

**When to keep volumes:**
- You have important data
- You want to preserve database
- You're just cleaning up containers

**When to delete volumes:**
- You want a completely fresh start
- Data is corrupted
- You're testing
- You have backups

---

## 🆚 Stop vs Delete

| Action | Command | What Happens | Can Restart? | Data Preserved? |
|--------|---------|--------------|--------------|-----------------|
| **Stop** | `docker-compose stop` | Containers stop, remain | ✅ Yes, just `up -d` | ✅ Yes |
| **Down** | `docker-compose down` | Containers removed | ✅ Yes, just `up -d` | ✅ Yes (volumes) |
| **Down -v** | `docker-compose down -v` | Everything removed | ✅ Yes, just `up -d` | ❌ No (volumes deleted) |
| **Down --rmi** | `docker-compose down --rmi all` | Everything + images removed | ✅ Yes, rebuilds images | ❌ No |

**Use STOP when:** You want to pause temporarily, save resources, do maintenance  
**Use DOWN when:** You want to clean up containers but keep data  
**Use DOWN -v when:** You want a clean slate, remove everything, start fresh

---

## 🔄 Comparison with Kubernetes

| Docker Compose | Kubernetes |
|----------------|------------|
| `docker-compose down` | `kubectl delete namespace ...` |
| `docker-compose down -v` | `kubectl delete namespace ...` (volumes deleted) |
| `docker-compose down --rmi all` | Delete namespace + remove images from registry |
| Containers removed | Pods, deployments, services removed |
| Images remain (default) | Images remain in registry |
| Volumes deleted with `-v` | Persistent volumes deleted with namespace |

---

## 🧹 Cleanup Commands Reference

```bash
# Stop containers (keep everything)
docker-compose stop

# Stop and remove containers (keep volumes and images)
docker-compose down

# Stop and remove containers and volumes (keep images)
docker-compose down -v

# Stop and remove everything including images
docker-compose down -v --rmi all

# Remove only stopped containers
docker-compose rm

# Remove containers with volumes
docker-compose rm -v

# Remove unused images (not used by any container)
docker image prune

# Remove all unused Docker resources
docker system prune

# Remove everything including volumes
docker system prune -a --volumes
```

