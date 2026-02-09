# Client Nginx Configuration Explained

This document explains the `client/nginx.conf` file used inside the React app's Docker container. This configuration is crucial for serving the React Single Page Application (SPA) correctly.

## Overview

**Purpose:** Configure Nginx to serve the React app's static files with proper SPA routing support, compression, and caching.

**Location:** `client/nginx.conf` (copied to `/etc/nginx/conf.d/default.conf` in container)

**When it's used:** This config is used inside the Docker container to serve the built React app.

## Complete Configuration

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Line-by-Line Explanation

### Server Block

#### `server {`
- **What it does**: Starts a server block (virtual host configuration)
- **Why**: Defines how Nginx should handle requests for this application
- **Note**: Can have multiple `server` blocks for different domains/apps

#### `listen 80;`
- **What it does**: Tells Nginx to listen on port 80 (HTTP)
- **Why**: Port 80 is the standard HTTP port
- **In container**: Container listens on port 80, mapped to host port (e.g., 3001:80)
- **Note**: This is HTTP inside container. HTTPS termination happens at host Nginx level

#### `server_name localhost;`
- **What it does**: Sets the server name to `localhost`
- **Why**: Inside Docker container, requests come from localhost (via reverse proxy)
- **Note**: The host Nginx (on server) handles the actual domain name
- **Flow**: `yourdomain.com` → Host Nginx → `localhost:3001` → Container Nginx (this config)

#### `root /usr/share/nginx/html;`
- **What it does**: Sets the root directory where Nginx looks for files
- **Why**: This is where Dockerfile copies the built React app
- **Path**: `/usr/share/nginx/html` is Nginx's default web root
- **Contains**: All files from `npm run build` (HTML, CSS, JS, images, etc.)

#### `index index.html;`
- **What it does**: Sets `index.html` as the default file to serve
- **Why**: When someone visits `/`, Nginx serves `index.html`
- **React**: `index.html` is the entry point of your React app
- **Contains**: The HTML shell that loads your React JavaScript bundle

### Gzip Compression

#### `gzip on;`
- **What it does**: Enables gzip compression
- **Why**: Compresses files before sending to browser (reduces bandwidth)
- **Benefit**: Smaller file sizes = faster page loads
- **Example**: A 500KB JavaScript file might become 150KB when compressed

#### `gzip_vary on;`
- **What it does**: Adds `Vary: Accept-Encoding` header
- **Why**: Tells browsers/caches that content varies based on encoding
- **Benefit**: Ensures proper caching behavior with compression
- **Best practice**: Should always be enabled when using gzip

#### `gzip_min_length 1024;`
- **What it does**: Only compress files larger than 1024 bytes (1KB)
- **Why**: Small files don't benefit much from compression (overhead not worth it)
- **Benefit**: Saves CPU by not compressing tiny files
- **Note**: Files smaller than 1KB are sent uncompressed

#### `gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;`
- **What it does**: Lists file types to compress
- **Why**: Only certain file types compress well (text-based files)
- **Types compressed**:
  - `text/plain` - Plain text files
  - `text/css` - CSS stylesheets
  - `text/xml` - XML files
  - `text/javascript` - JavaScript files
  - `application/x-javascript` - Alternative JavaScript MIME type
  - `application/xml+rss` - RSS feeds
  - `application/json` - JSON data
- **Not compressed**: Images (already compressed), binary files
- **Note**: Modern Nginx can use `gzip_types *;` to compress all text-based types

### React Router Support (SPA Routing)

#### `location / {`
- **What it does**: Defines how to handle requests to the root path and all sub-paths
- **Why**: This is the main location block for your React app
- **Matches**: All URLs like `/`, `/login`, `/dashboard`, `/admin/users`, etc.

#### `try_files $uri $uri/ /index.html;`
- **What it does**: Tries to serve files in this order:
  1. `$uri` - The exact file requested (e.g., `/static/js/main.js`)
  2. `$uri/` - The file as a directory (e.g., `/dashboard/` → `/dashboard/index.html`)
  3. `/index.html` - Falls back to `index.html` if file doesn't exist
- **Why React Router needs this**: 
  - React Router handles routing in the browser (client-side)
  - When you visit `/dashboard`, there's no actual `/dashboard` file on server
  - Nginx would return 404 without this fallback
  - By falling back to `index.html`, React Router can handle the route
- **How it works**:
  ```
  User visits: https://yourdomain.com/dashboard
  ↓
  Nginx tries: /dashboard (file) → Not found
  Nginx tries: /dashboard/ (directory) → Not found
  Nginx serves: /index.html → ✅ Success
  ↓
  Browser loads index.html → React Router sees /dashboard → Shows Dashboard component
  ```
- **Critical**: Without this, React Router routes will return 404 errors

### Static Asset Caching

#### `location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {`
- **What it does**: Matches requests for static asset files
- **`~*`**: Case-insensitive regex match
- **Pattern**: `\.(js|css|png|jpg|jpeg|gif|ico|svg)$`
  - `\.` - Literal dot (escaped)
  - `(js|css|png|...)` - File extension
  - `$` - End of string
- **Matches**: Files ending in `.js`, `.css`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`, `.svg`
- **Examples**: 
  - `/static/js/main.abc123.js` ✅
  - `/static/css/style.def456.css` ✅
  - `/logo.png` ✅
  - `/favicon.ico` ✅

#### `expires 1y;`
- **What it does**: Sets cache expiration to 1 year
- **Why**: Static assets (JS, CSS, images) rarely change
- **Benefit**: Browser caches files for 1 year = fewer requests = faster loads
- **How it works**: Adds `Expires` header with date 1 year in future
- **Note**: When you deploy new version, file names change (React adds hash), so new files are fetched

#### `add_header Cache-Control "public, immutable";`
- **What it does**: Adds `Cache-Control` header
- **`public`**: Can be cached by browsers and CDNs
- **`immutable`**: File will never change (because filename has hash)
- **Why**: React build process adds hash to filenames (e.g., `main.abc123.js`)
- **Benefit**: 
  - If filename changes → new file (new version)
  - If filename same → cached version (no download)
- **Example**: 
  - Version 1: `main.abc123.js` → Cached
  - Version 2: `main.xyz789.js` → New file (different hash)

## How It All Works Together

### Request Flow

```
1. User visits: https://yourdomain.com/dashboard
   ↓
2. Host Nginx (port 443) receives HTTPS request
   ↓
3. Host Nginx proxies to: http://localhost:3001/dashboard
   ↓
4. Container Nginx (this config) receives request
   ↓
5. try_files checks:
   - /dashboard (file) → Not found
   - /dashboard/ (directory) → Not found
   - /index.html → ✅ Found and served
   ↓
6. Browser receives index.html
   ↓
7. Browser loads React JavaScript bundle
   ↓
8. React Router sees URL is /dashboard
   ↓
9. React Router renders Dashboard component
```

### Static Asset Request Flow

```
1. Browser requests: /static/js/main.abc123.js
   ↓
2. Container Nginx matches location ~* \.(js|css|...)$
   ↓
3. Serves file from /usr/share/nginx/html/static/js/main.abc123.js
   ↓
4. Adds headers:
   - Expires: (1 year from now)
   - Cache-Control: public, immutable
   ↓
5. Browser caches file for 1 year
```

## Why This Configuration is Needed

### Problem 1: React Router 404 Errors

**Without `try_files`:**
- Visit `/dashboard` → Nginx looks for `/dashboard` file → 404 Not Found ❌

**With `try_files`:**
- Visit `/dashboard` → Nginx serves `index.html` → React Router handles route ✅

### Problem 2: Large File Sizes

**Without gzip:**
- JavaScript bundle: 500KB
- CSS file: 100KB
- Total: 600KB download

**With gzip:**
- JavaScript bundle: 150KB (compressed)
- CSS file: 30KB (compressed)
- Total: 180KB download (70% smaller!)

### Problem 3: Slow Page Loads

**Without caching:**
- Every page load downloads all assets
- 600KB every time = slow

**With caching:**
- First load: 600KB
- Subsequent loads: 0KB (from cache) = instant!

## Common Modifications

### Add More File Types to Compression

```nginx
gzip_types 
    text/plain 
    text/css 
    text/xml 
    text/javascript 
    application/javascript 
    application/json 
    application/xml 
    image/svg+xml;
```

### Change Cache Duration

```nginx
# Cache for 6 months instead of 1 year
expires 6M;

# Or cache forever (not recommended)
expires max;
```

### Add Security Headers

```nginx
location / {
    try_files $uri $uri/ /index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Serve API Proxy (if needed)

```nginx
# Proxy API requests to backend
location /api {
    proxy_pass http://server:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Custom Error Pages

```nginx
error_page 404 /index.html;  # SPA fallback
error_page 500 502 503 504 /50x.html;
```

## Troubleshooting

### React Router Routes Return 404

**Problem:** Visiting `/dashboard` shows 404 error

**Solution:**
- Verify `try_files $uri $uri/ /index.html;` is in `location /` block
- Check nginx.conf is copied correctly in Dockerfile
- Rebuild container: `docker-compose build --no-cache client`

**Test:**
```bash
# Inside container
docker exec -it node-react-rbac-client cat /etc/nginx/conf.d/default.conf
```

### Files Not Compressed

**Problem:** Files still large, no compression

**Solution:**
- Verify `gzip on;` is set
- Check browser DevTools → Network → Response Headers for `Content-Encoding: gzip`
- Ensure file type is in `gzip_types` list

**Test:**
```bash
# Check if gzip is working
curl -H "Accept-Encoding: gzip" -I http://localhost:3001/static/js/main.js
# Should see: Content-Encoding: gzip
```

### Assets Not Cached

**Problem:** Browser downloads assets on every page load

**Solution:**
- Verify `expires` and `Cache-Control` headers are set
- Check browser DevTools → Network → Response Headers
- Ensure location block matches your asset files

**Test:**
```bash
# Check cache headers
curl -I http://localhost:3001/static/js/main.js
# Should see: Cache-Control: public, immutable
```

### Nginx Configuration Not Applied

**Problem:** Changes to nginx.conf don't take effect

**Solution:**
1. Rebuild container: `docker-compose build --no-cache client`
2. Restart container: `docker-compose restart client`
3. Check config inside container: `docker exec -it node-react-rbac-client nginx -t`

**Verify:**
```bash
# Test Nginx config syntax
docker exec -it node-react-rbac-client nginx -t

# Reload Nginx (if config is correct)
docker exec -it node-react-rbac-client nginx -s reload
```

### Wrong File Paths

**Problem:** 404 errors for static files

**Solution:**
- Verify `root /usr/share/nginx/html;` is correct
- Check files exist: `docker exec -it node-react-rbac-client ls -la /usr/share/nginx/html`
- Ensure Dockerfile copies build files correctly

**Debug:**
```bash
# List files in container
docker exec -it node-react-rbac-client ls -la /usr/share/nginx/html

# Check Nginx error logs
docker exec -it node-react-rbac-client tail -f /var/log/nginx/error.log
```

## Best Practices

### 1. Always Include SPA Fallback
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
**Critical for React Router to work!**

### 2. Enable Compression
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
```
**Reduces bandwidth and improves load times**

### 3. Cache Static Assets
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```
**Faster subsequent page loads**

### 4. Use Specific File Extensions
Don't use wildcards that might match HTML files:
```nginx
# Good ✅
location ~* \.(js|css|png)$ { ... }

# Bad ❌ (might cache HTML)
location ~* \.(.*)$ { ... }
```

### 5. Test Configuration
Always test after changes:
```bash
docker-compose build --no-cache client
docker-compose up -d client
docker exec -it node-react-rbac-client nginx -t
```

## Comparison: With vs Without This Config

### Without Custom nginx.conf (Default Nginx)

**Problems:**
- React Router routes return 404
- No compression (larger files)
- No caching (slower loads)
- Poor performance

### With Custom nginx.conf (This Config)

**Benefits:**
- ✅ React Router works correctly
- ✅ Files compressed (70% smaller)
- ✅ Assets cached (instant loads)
- ✅ Optimized performance

## Summary

**Key Points:**
1. **`try_files`** - Essential for React Router (SPA routing)
2. **`gzip`** - Compresses files (faster downloads)
3. **`expires` + `Cache-Control`** - Caches assets (faster loads)
4. **Location blocks** - Different rules for different file types

**This configuration:**
- Enables React Router to work correctly
- Optimizes performance with compression
- Improves user experience with caching
- Follows Nginx best practices for SPAs

## Quick Reference

```nginx
# Basic SPA config
location / {
    try_files $uri $uri/ /index.html;
}

# Compression
gzip on;
gzip_types text/css application/javascript application/json;

# Caching
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Reverse-proxy update (applied)

Small, minimal changes were made so the client container's Nginx proxies API requests to the backend service when running via Docker Compose:

- Added a `location /api/` proxy block to `client/nginx.conf` that forwards requests to `http://server:5000/`.
- Updated `docker-compose.yml` to set `REACT_APP_API_URL=/api` for the `client` build so the frontend uses relative API paths (e.g., `fetch('/api/login')`), ensuring requests go through Nginx and avoid CORS issues.

Notes:
- If your backend is inside Docker Compose, the proxy target `server:5000` resolves automatically on the `app-network`.
- If your backend runs outside Docker (on host), you can change `proxy_pass` to `http://host.docker.internal:5000` (Docker Desktop) or to the host IP.
- Rebuild the client image after these changes:
  - `docker-compose build --no-cache client`
  - `docker-compose up -d`

