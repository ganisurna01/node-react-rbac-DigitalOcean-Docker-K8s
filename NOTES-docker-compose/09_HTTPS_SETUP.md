# HTTPS Setup Guide - SSL/TLS with Let's Encrypt

This guide explains how to set up HTTPS (SSL/TLS) for your Node React RBAC application using Let's Encrypt and Nginx reverse proxy.

## Overview

**What we'll do:**
1. Install Nginx on the host server (not in container)
2. Install Certbot to get free SSL certificates from Let's Encrypt
3. Configure Nginx as reverse proxy with HTTPS
4. Update application to use HTTPS
5. Set up automatic certificate renewal

**Result:**
- Your app will be accessible via `https://yourdomain.com` instead of `http://139.59.6.209:3001`
- Secure encrypted connection (HTTPS)
- Free SSL certificate (auto-renewed)

## Prerequisites

### Important Concept: Ports 80 & 443 with Multiple Apps

- **Only one process** can listen on `80` and `443` for a given server IP.
- In production, that **one process should be Nginx**, not your app containers directly.
- You can still host **multiple apps** on the same server by:
  - Letting **one Nginx instance** listen on ports `80` and `443`
  - Defining **multiple `server { ... }` blocks** with different `server_name` values  
    (e.g. `app1.com`, `app2.com`)
  - Each `server` block **proxies** to a different backend/app port  
    (e.g. `http://localhost:3001`, `http://localhost:4001`, etc.)
- If another app is already using `80/443` directly (without Nginx):
  - You **cannot** bind this app to `80/443` at the same time
  - Fix by either:
    - Moving that app **behind Nginx** too, or
    - Changing that app to use **different ports**, or
    - Stopping that app so Nginx can own `80/443`

**Mental model to remember:**  
👉 *One Nginx on `80/443`, many apps behind it on different internal ports.*

### How to Check Which Internal Ports Are Already in Use

Before setting up a new app, you need to know which ports are available. Here's how to check:

#### Method 1: List All Listening Ports

```bash
# Show all listening TCP ports with process info
ss -tlnp

# Or using netstat (older method)
netstat -tlnp

# Filter for specific port range (e.g., 3000-6000)
ss -tlnp | grep -E ':(300[0-9]|400[0-9]|500[0-9]|600[0-9])'
```

**Output example:**
```
LISTEN  0   128   0.0.0.0:3001   0.0.0.0:*   users:(("docker-proxy",pid=1234))
LISTEN  0   128   0.0.0.0:5000   0.0.0.0:*   users:(("docker-proxy",pid=5678))
LISTEN  0   128   0.0.0.0:80    0.0.0.0:*   users:(("nginx",pid=9012))
```

#### Method 2: Check Specific Port

```bash
# Check if a specific port is in use (e.g., port 3001)
ss -tlnp | grep :3001

# Or using lsof
lsof -i :3001

# Or using netstat
netstat -tlnp | grep :3001
```

**If port is in use:** You'll see the process name and PID  
**If port is free:** No output (port is available)

#### Method 3: Check Docker Container Ports

```bash
# List all running containers and their port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Or more detailed
docker ps

# Check specific container
docker port <container-name>

# Example: Check what ports node-react-rbac-client uses
docker port node-react-rbac-client
```

**Output example:**
```
CONTAINER NAME              PORTS
node-react-rbac-client     0.0.0.0:3001->80/tcp
node-react-rbac-server     0.0.0.0:5000->5000/tcp
```

#### Method 4: Check All Ports Used by Docker

```bash
# Show all Docker container port mappings
docker ps --format "{{.Names}}: {{.Ports}}" | grep -oP '\d+:\d+'

# Or inspect docker-compose services
cd /var/www/node-react-rbac
docker-compose ps
```

#### Method 5: Find Available Ports

```bash
# Test if a port is available (returns nothing if free)
nc -zv localhost 3001

# Or using telnet
telnet localhost 3001

# If connection refused or timeout: port is free
# If connection successful: port is in use
```

#### Quick Reference: Common Port Ranges

- **3000-3999**: Common for development/frontend apps
- **4000-4999**: Common for development/backend apps  
- **5000-5999**: Common for APIs and services
- **8000-8999**: Alternative development ports
- **9000-9999**: Alternative service ports

**Tip:** When choosing a port for a new app:
1. Check if it's already in use (use methods above)
2. Avoid well-known ports (0-1023 require root)
3. Use consistent ranges (e.g., all your apps in 3000-3999)
4. Document which app uses which port

#### Example: Finding Available Port for New App

```bash
# Step 1: Check what's currently in use
ss -tlnp | grep -E ':(300[0-9]|400[0-9]|500[0-9])'

# Step 2: Let's say you see:
# - 3001 is used (existing app)
# - 5000 is used (existing app)
# - 3002, 3003, 4001, etc. are free

# Step 3: Choose an available port (e.g., 3002)
# Step 4: Verify it's free
ss -tlnp | grep :3002
# (No output = port is free ✅)

# Step 5: Use that port in your docker-compose.yml
```

### 1. Domain Name
- You need a domain name (e.g., `example.com`, `myapp.com`)
- Can purchase from: Namecheap, GoDaddy, Google Domains, etc.

### 2. DNS Configuration
Point your domain to your server IP:

**DNS Records to Add:**
```
Type: A
Name: @ (or leave blank)
Value: 139.59.6.209
TTL: 3600 (or default)
```

**For subdomain (optional):**
```
Type: A
Name: www
Value: 139.59.6.209
TTL: 3600
```

**Verify DNS:**
```bash
# Check if DNS is pointing to your server
dig yourdomain.com
# or
nslookup yourdomain.com

# Should return: 139.59.6.209
```

**Important:** Wait for DNS propagation (can take 5 minutes to 48 hours). Verify before proceeding.

### 3. Current Setup
- Docker containers running on ports 3001 (client) and 5000 (server)
- Server accessible via SSH

## Step 1: Install Nginx on Host Server

**Why:** We need Nginx on the host (not in container) to handle SSL termination and reverse proxy.

```bash
# Connect to your server
ssh root@139.59.6.209

# Update package list
apt update

# Install Nginx
apt install nginx -y

# Check Nginx status
systemctl status nginx

# Start Nginx (if not running)
systemctl start nginx

# Enable Nginx to start on boot
systemctl enable nginx
```

**Verify Nginx is running:**
```bash
# Check if Nginx is listening on port 80
netstat -tlnp | grep :80
# or
ss -tlnp | grep :80
```

## Step 2: Configure Firewall

Allow HTTP (80) and HTTPS (443) ports:

```bash
# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Check firewall status
ufw status
```

## Step 3: Install Certbot

Certbot is the tool that gets SSL certificates from Let's Encrypt.

```bash
# Install Certbot and Nginx plugin
apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
```

## Step 4: Create Initial Nginx Configuration (HTTP)

Before getting SSL certificate, we need a basic HTTP configuration.

```bash
# Create Nginx configuration file (In DigitalOcean Droplet Server)
nano /etc/nginx/sites-available/node-react-rbac
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - React App
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Important:** Replace `yourdomain.com` with your actual domain name!

**Enable the site:**
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/node-react-rbac /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

**Verify it works:**
- Open browser: `http://yourdomain.com`
- Should see your React app

## Step 5: Get SSL Certificate with Certbot

Now we'll get the SSL certificate. Certbot will automatically modify the Nginx config to add HTTPS.

```bash
# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# 1. Enter email address (for renewal notifications)
# 2. Agree to terms of service
# 3. Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

**What Certbot does:**
1. Verifies domain ownership
2. Gets SSL certificate from Let's Encrypt
3. Automatically updates Nginx config to use HTTPS
4. Sets up automatic renewal

**Verify certificate:**
```bash
# Check certificate files
ls -la /etc/letsencrypt/live/yourdomain.com/

# Should see:
# - cert.pem (certificate)
# - chain.pem (certificate chain)
# - fullchain.pem (certificate + chain)
# - privkey.pem (private key)
```

## Step 6: Verify HTTPS Configuration

After Certbot runs, your Nginx config will be updated. Check it:

```bash
# View updated configuration
cat /etc/nginx/sites-available/node-react-rbac
```

**You should see something like:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend - React App
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Test and reload:**
```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

**Test HTTPS:**
- Open browser: `https://yourdomain.com`
- Should see padlock icon (🔒) in address bar
- HTTP should automatically redirect to HTTPS

## Step 7: Update Docker Compose Configuration

We need to update `docker-compose.yml` to:
1. Not expose ports directly (Nginx handles external access)
2. Update client to use HTTPS API URL

**Option A: Keep ports exposed (for debugging)**
Keep current configuration - ports 3001 and 5000 remain accessible.

**Option B: Remove port exposure (more secure)**
Only allow access through Nginx.

**Update docker-compose.yml:**

```yaml
version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: node-react-rbac-server
    restart: unless-stopped
    # Remove or comment out ports if using Nginx only
    # ports:
    #   - "${PORT:-5000}:5000"
    expose:
      - "5000"  # Expose only to Docker network
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-5000}
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - app-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        # Update to use HTTPS
        - REACT_APP_API_URL=https://yourdomain.com/api
    container_name: node-react-rbac-client
    restart: unless-stopped
    # Remove or comment out ports if using Nginx only
    # ports:
    #   - "3001:80"
    expose:
      - "80"  # Expose only to Docker network
    depends_on:
      - server
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Important:** Replace `yourdomain.com` with your actual domain!

**Rebuild and restart:**
```bash
cd /var/www/node-react-rbac

# Rebuild client with new API URL
docker-compose build --no-cache client

# Restart containers
docker-compose down
docker-compose up -d

# Verify containers are running
docker-compose ps
```

## Step 8: Update Nginx to Use Container Network (Optional)

If you removed port exposure, Nginx needs to connect via Docker network:

**Find Docker network:**
```bash
# Get network name
docker network ls

# Inspect network to get gateway IP
docker network inspect node-react-rbac_app-network
```

**Update Nginx config to use Docker network IP:**
```nginx
# Instead of localhost:3001, use Docker network IP
proxy_pass http://172.18.0.2:3001;  # Replace with actual IP
```

**Better approach:** Keep ports exposed but only bind to localhost:

```yaml
# In docker-compose.yml
ports:
  - "127.0.0.1:3001:80"  # Only accessible from localhost
  - "127.0.0.1:5000:5000"  # Only accessible from localhost
```

This way Nginx can still use `localhost:3001` and `localhost:5000`, but ports aren't exposed externally.

## Step 9: Set Up Automatic Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot sets up automatic renewal, but let's verify:

```bash
# Test renewal (dry run)
certbot renew --dry-run

# Check renewal timer
systemctl status certbot.timer

# Enable auto-renewal (should be enabled by default)
systemctl enable certbot.timer
systemctl start certbot.timer
```

**Verify renewal schedule:**
```bash
# List systemd timers
systemctl list-timers | grep certbot
```

Certbot will automatically renew certificates and reload Nginx when needed.

## Step 10: Update CORS Settings (If Needed)

If your backend has CORS restrictions, update them to allow your domain:

**In server code (if CORS is configured):**
```javascript
// Allow your domain
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

## Complete Architecture

```
Internet
   ↓
HTTPS (443) → Nginx (Host)
   ↓
   ├─→ / → http://localhost:3001 → Client Container (port 80)
   └─→ /api → http://localhost:5000 → Server Container (port 5000)
```

## Testing HTTPS

### 1. Browser Test
- Visit: `https://yourdomain.com`
- Check for padlock icon (🔒)
- Check certificate details (click padlock)

### 2. SSL Labs Test
- Visit: https://www.ssllabs.com/ssltest/
- Enter your domain
- Check SSL rating (should be A or A+)

### 3. Command Line Test
```bash
# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Certificate Not Issued

**Problem:** Certbot fails to verify domain

**Solutions:**
- Verify DNS is pointing to server: `dig yourdomain.com`
- Ensure port 80 is open: `ufw allow 80/tcp`
- Check Nginx is running: `systemctl status nginx`
- Verify domain is accessible: `curl http://yourdomain.com`

### Nginx Configuration Errors

**Problem:** `nginx -t` fails

**Solutions:**
- Check syntax: `nginx -t` (shows error location)
- Verify all paths are correct
- Check file permissions
- Review error logs: `tail -f /var/log/nginx/error.log`

### 502 Bad Gateway

**Problem:** Nginx can't connect to containers

**Solutions:**
- Verify containers are running: `docker-compose ps`
- Check ports are accessible: `curl http://localhost:3001`
- Verify Nginx proxy_pass URLs are correct
- Check Docker network: `docker network inspect node-react-rbac_app-network`

### Mixed Content Warnings

**Problem:** Browser shows "Mixed Content" (HTTP resources on HTTPS page)

**Solutions:**
- Ensure all API calls use HTTPS
- Update `REACT_APP_API_URL` to use `https://`
- Check browser console for HTTP requests
- Use browser DevTools → Network tab to find HTTP requests

### Certificate Renewal Fails

**Problem:** Auto-renewal doesn't work

**Solutions:**
- Test manually: `certbot renew --dry-run`
- Check certbot logs: `journalctl -u certbot.timer`
- Verify Nginx is running during renewal
- Check firewall allows port 80 (needed for renewal)

### Can't Access After HTTPS Setup

**Problem:** Site not accessible

**Solutions:**
- Check Nginx is running: `systemctl status nginx`
- Verify containers are running: `docker-compose ps`
- Check firewall: `ufw status`
- Test localhost: `curl http://localhost:3001`
- Review Nginx error logs: `tail -f /var/log/nginx/error.log`

## Security Best Practices

### 1. Strong SSL Configuration
The Certbot-generated config includes good defaults, but you can enhance:

```nginx
# Add to server block
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 2. Hide Nginx Version
```nginx
# Add to http block in /etc/nginx/nginx.conf
server_tokens off;
```

### 3. Rate Limiting
```nginx
# Add to http block
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Add to /api location
limit_req zone=api_limit burst=20;
```

### 4. Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## Maintenance

### Renew Certificate Manually
```bash
certbot renew
systemctl reload nginx
```

### Check Certificate Expiration
```bash
certbot certificates
```

### Revoke Certificate (if needed)
```bash
certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem
```

### View Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

## Updating Domain or Adding Subdomains

### Add New Domain
```bash
certbot --nginx -d newdomain.com -d www.newdomain.com
```

### Add Subdomain
```bash
# Add DNS A record for subdomain
# Then:
certbot --nginx -d api.yourdomain.com
```

## Common Nginx Configurations

### Serve Static Files Directly
```nginx
location /static {
    alias /var/www/node-react-rbac/client/build/static;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### WebSocket Support (if needed)
```nginx
location /ws {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Custom Error Pages
```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;
```

## Next Steps

1. **Monitor certificate expiration** - Set up alerts
2. **Set up monitoring** - Uptime monitoring for HTTPS
3. **Configure CDN** - Use Cloudflare or similar for better performance
4. **Add staging environment** - Separate HTTPS setup for staging
5. **Implement HSTS** - Already included in security headers above

## Summary

✅ **What we accomplished:**
- Installed Nginx reverse proxy
- Obtained free SSL certificate from Let's Encrypt
- Configured HTTPS with automatic HTTP to HTTPS redirect
- Updated application to use HTTPS
- Set up automatic certificate renewal

✅ **Your app is now:**
- Accessible via `https://yourdomain.com`
- Secured with SSL/TLS encryption
- Automatically redirects HTTP to HTTPS
- Using free, auto-renewing SSL certificates

## Quick Reference Commands

```bash
# Check Nginx status
systemctl status nginx

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Check SSL certificate
certbot certificates

# Test certificate renewal
certbot renew --dry-run

# View Nginx logs
tail -f /var/log/nginx/error.log

# Check containers
docker-compose ps

# Restart containers
docker-compose restart
```

