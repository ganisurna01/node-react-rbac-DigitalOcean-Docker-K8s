# Complete Deployment Guide - Overview

> **📌 Note:** This guide provides an overview. For detailed step-by-step instructions, see:
> - **[Manual Deployment Guide](./07_MANUAL_DEPLOYMENT.md)** - Deploy manually without CI/CD
> - **[Automated Deployment Guide](./08_AUTOMATED_DEPLOYMENT.md)** - Set up CI/CD with GitHub Actions

This guide provides a general overview of deploying the Node React RBAC application to Digital Ocean Droplet using Docker.

## Prerequisites

1. **Digital Ocean Droplet** with IP: 139.59.6.209
2. **SSH Access** to the droplet (root user)
3. **GitHub Repository** with secrets configured
4. **Docker** installed on the droplet
5. **Docker Compose** installed on the droplet

## Deployment Methods

Choose one of the following deployment methods:

### Option 1: Manual Deployment
For manual deployment without CI/CD, see: **[07_MANUAL_DEPLOYMENT.md](./07_MANUAL_DEPLOYMENT.md)**

### Option 2: Automated Deployment (CI/CD)
For automated deployment with GitHub Actions, see: **[08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)**

---

## Overview: Initial Server Setup

### 1.1 Connect to Your Droplet
```bash
ssh root@139.59.6.209
```

### 1.2 Install Docker (if not already installed)
```bash
# Update system
apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 1.3 Create Application Directory
```bash
# Navigate to /var/www
cd /var/www

# Create directory for our app
mkdir -p node-react-rbac
cd node-react-rbac
```

## Step 2: Clone Repository

> **📌 Important:** GitHub doesn't support password authentication. You must use SSH keys.

For detailed instructions on setting up SSH keys for GitHub on the droplet, see:
- **Manual Deployment**: [07_MANUAL_DEPLOYMENT.md](./07_MANUAL_DEPLOYMENT.md) - Step 2
- **Automated Deployment**: [08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md) - Step 1.4

**Quick summary:**
1. Generate SSH key on droplet: `ssh-keygen -t ed25519 -C "droplet-github"`
2. Add public key to GitHub: Settings → SSH and GPG Keys
3. Clone using SSH: `git clone git@github.com:Ganesh-Surna/node-react-rbac.git .`

## Step 3: Configure Environment Variables

### 3.1 Create .env File
```bash
cd /var/www/node-react-rbac
nano .env
```

### 3.2 Add Environment Variables
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
```

**Important:** Replace the placeholder values with your actual:
- MongoDB connection string (from MongoDB Atlas or your MongoDB instance)
- JWT secret (a long random string for token encryption)

## Step 4: GitHub Secrets (For Automated Deployment Only)

> **Note:** GitHub Secrets are only needed if you're setting up automated deployment (CI/CD).  
> For manual deployment, skip this step.  
> See **[08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)** for complete setup instructions.

If setting up automated deployment, go to your GitHub repository → Settings → Secrets and variables → Actions

Add this secret:
1. **SSH_PRIVATE_KEY**: Your private SSH key to access the droplet

For detailed SSH key setup instructions, see: **[08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)**

## Step 5: Update Docker Compose for Production

The `docker-compose.yml` file uses environment variables. Make sure the API URL in the client build matches your server IP.

Current configuration:
- Server runs on port 5000 (or PORT from .env)
- Client runs on port 3000
- Client connects to server at: http://139.59.6.209:5000

## Step 6: Build and Run with Docker

### 6.1 Build Images
```bash
cd /var/www/node-react-rbac
docker-compose build
```

### 6.2 Start Containers
```bash
docker-compose up -d
```

The `-d` flag runs containers in detached mode (in the background).

### 6.3 Check Status
```bash
docker-compose ps
docker-compose logs
```

## Step 7: Verify Deployment

1. **Check Server Health:**
   ```bash
   curl http://139.59.6.209:5000/api/health
   ```
   Should return: `{"message":"Server is running!"}`

2. **Access Frontend:**
   Open browser: `http://139.59.6.209:3000`

3. **Test Application:**
   - Register a new user
   - Login
   - Test different role-based pages

## CI/CD Setup

For detailed CI/CD setup instructions, see: **[08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)**

**Quick overview:**
- Automated deployment triggers on push to `main` branch
- Requires SSH key setup and GitHub Secrets configuration
- See the automated deployment guide for complete setup steps

## Step 9: Firewall Configuration

Make sure these ports are open on your droplet:

```bash
# Allow port 5000 (backend)
ufw allow 5000/tcp

# Allow port 3000 (frontend)
ufw allow 3000/tcp

# Check firewall status
ufw status
```

## Step 10: Nginx Reverse Proxy (Optional)

If you want to use domain names instead of IP:port, set up Nginx:

```bash
# Install Nginx
apt install nginx -y

# Create configuration
nano /etc/nginx/sites-available/node-react-rbac
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs server
docker-compose logs client
```

### Port already in use
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3000

# Stop conflicting services or change ports in docker-compose.yml
```

### MongoDB connection issues
- Verify MONGODB_URI in .env file
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
- Verify network connectivity

### Frontend can't connect to backend
- Check REACT_APP_API_URL in client Dockerfile build args
- Verify backend is running: `curl http://139.59.6.209:5000/api/health`
- Check CORS settings in server

## Maintenance Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose stop

# Start services
docker-compose start

# Remove everything (careful!)
docker-compose down -v

# Update and redeploy
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

## Directory Structure on Server

```
/var/www/
├── gurukulamhub/          # Your existing app (untouched)
└── node-react-rbac/       # New app
    ├── .env               # Environment variables
    ├── docker-compose.yml # Docker orchestration
    ├── client/            # Frontend code
    ├── server/            # Backend code
    └── .git/              # Git repository
```

## Security Notes

1. **Never commit .env file** - It contains sensitive information
2. **Use strong JWT_SECRET** - Generate a random long string
3. **Keep Docker updated** - Regularly update Docker and images
4. **Use HTTPS** - Set up SSL certificates for production
5. **Firewall rules** - Only open necessary ports

## Next Steps

1. Set up domain name and SSL (Let's Encrypt)
2. Configure monitoring and logging
3. Set up automated backups
4. Configure email notifications for deployments

