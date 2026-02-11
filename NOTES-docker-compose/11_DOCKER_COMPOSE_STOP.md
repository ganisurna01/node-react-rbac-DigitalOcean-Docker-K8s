# Stop/Pause Docker Compose Deployment

## 🛑 Quick Commands to Stop Your App

Use these commands when you want to **pause/stop** your application without deleting anything. You can easily start it again later.

---

## 📋 Stop All Containers (Multiple Options)

### **Option 1: Stop Containers (Recommended)**

This stops all containers but keeps them (can restart quickly):

```bash
# SSH to your server
ssh root@139.59.6.209

# Navigate to project directory
cd /var/www/node-react-rbac

# Stop all containers
docker-compose stop

# Verify containers are stopped
docker-compose ps
# Should show containers with status "Exited"
```

**What happens:**
- ✅ Containers stop running
- ✅ Containers remain (not deleted)
- ✅ Images remain
- ✅ Volumes remain
- ✅ Networks remain
- ✅ Configuration files remain

### **Option 2: Stop Specific Service**

If you want to stop only one service:

```bash
# Stop only server
docker-compose stop server

# Stop only client
docker-compose stop client

# Verify
docker-compose ps
```

### **Option 3: Pause Containers (Alternative)**

Pause containers instead of stopping (faster to resume, but uses more resources):

```bash
# Pause all containers
docker-compose pause

# Resume later
docker-compose unpause
```

**Difference:**
- `stop` - Stops containers completely (uses less resources)
- `pause` - Freezes containers (faster to resume, but uses memory)

---

## ✅ Start Containers Again

### **Option 1: Automatic Restart (CI/CD) - Recommended**

**Containers will automatically restart when you push code!** 🚀

When you push code to the `main` branch:
- The GitHub Actions workflow runs on your server
- It executes `docker-compose down` (removes stopped containers)
- Then `docker-compose build --no-cache` (rebuilds images)
- Then `docker-compose up -d` (creates and starts new containers)
- **No manual intervention needed!**

```bash
# Just push your code
git add .
git commit -m "Update application"
git push origin main

# The CI/CD pipeline will automatically:
# 1. Pull latest code
# 2. Stop and remove old containers (docker-compose down)
# 3. Rebuild images (docker-compose build --no-cache)
# 4. Start new containers (docker-compose up -d)
```

### **Option 2: Manual Start (If Needed)**

If you want to start containers manually without pushing code:

```bash
# SSH to server
ssh root@139.59.6.209

# Navigate to project directory
cd /var/www/node-react-rbac

# Start all containers
docker-compose up -d

# Or start specific service
docker-compose up -d server
docker-compose up -d client

# Verify containers are running
docker-compose ps
# Should show containers with status "Up"
```

### **Option 3: Restart Containers**

Restart containers without stopping first:

```bash
# Restart all containers
docker-compose restart

# Restart specific service
docker-compose restart server
docker-compose restart client
```

---

## 🔍 Check Status

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs

# Check logs for specific service
docker-compose logs server
docker-compose logs client

# Follow logs (live updates)
docker-compose logs -f

# Check all Docker containers (including stopped)
docker ps -a
```

---

## 📝 What Happens When You Stop

### **Using `docker-compose stop`:**
- ✅ **Containers stop** - No processes running
- ✅ **Containers remain** - Not deleted, can restart quickly
- ✅ **Images remain** - Docker images stay on disk
- ✅ **Volumes remain** - Data persists
- ✅ **Networks remain** - Network configuration preserved
- ✅ **Configuration files remain** - docker-compose.yml, .env, etc.
- ✅ **Everything can be restarted** - Just run `docker-compose up -d`

### **Using `docker-compose pause`:**
- ✅ **Containers pause** - Processes frozen in memory
- ✅ **Faster to resume** - Just unpause (no restart needed)
- ⚠️ **Uses memory** - Containers still consume RAM
- ✅ **Everything else same as stop**

---

## 🎓 Remember

- **Stopping = Containers stop, everything else stays** - Quick to restart
- **No data loss** - All configurations and data are preserved
- **Automatic restart on push** - CI/CD will start containers when you deploy
- **Manual restart available** - You can also start manually if needed
- **Useful for:** Pausing during maintenance, saving CPU resources, testing

---

## ⚠️ Important Notes

- **Services unavailable** - App won't respond to requests (containers stopped)
- **Database connections** - Will be lost (containers are stopped)
- **No cost savings** - You still pay for the droplet/server
- **Storage/volumes** - Remain intact (data is preserved)
- **Ports** - Still reserved by Docker (but nothing listening)

---

## 🆚 Stop vs Pause vs Down

| Command | What Happens | Restart Speed | Resource Usage |
|---------|--------------|---------------|----------------|
| **stop** | Containers stop, remain | Fast | Low (no CPU/RAM) |
| **pause** | Containers freeze | Instant | Medium (uses RAM) |
| **down** | Containers stop and removed | Slower (must recreate) | Low |

**Use `stop` when:** You want to pause temporarily, save CPU  
**Use `pause` when:** You want fastest resume time  
**Use `down` when:** You want to clean up completely (see DELETE guide)

---

## 🔄 Comparison with Kubernetes

| Docker Compose | Kubernetes |
|----------------|------------|
| `docker-compose stop` | `kubectl scale ... --replicas=0` |
| `docker-compose up -d` | `kubectl scale ... --replicas=2` |
| Containers remain | Pods removed, deployments remain |
| Manual or CI/CD restart | Automatic on CI/CD push |

