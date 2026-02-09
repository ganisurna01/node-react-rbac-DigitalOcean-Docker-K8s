# Documentation Index

This folder contains detailed explanations of all deployment components.

## 📚 Documentation Files

### 1. [01_DEPLOYMENT_GUIDE.md](./01_DEPLOYMENT_GUIDE.md)
**Complete step-by-step deployment guide**
- Initial server setup
- Installing Docker
- Configuring environment variables
- Building and running containers
- Setting up CI/CD
- Troubleshooting common issues

### 2. [02_CLIENT_DOCKERFILE.md](./02_CLIENT_DOCKERFILE.md)
**Client Dockerfile explained line by line**
- Multi-stage build process
- React build process
- Nginx configuration
- Environment variables in React
- Build optimization

### 3. [03_SERVER_DOCKERFILE.md](./03_SERVER_DOCKERFILE.md)
**Server Dockerfile explained line by line**
- Node.js container setup
- Dependency installation
- Docker layer caching
- Environment configuration
- Production considerations

### 4. [04_DOCKER_COMPOSE.md](./04_DOCKER_COMPOSE.md)
**Docker Compose orchestration explained**
- Service definitions
- Port mapping
- Network configuration
- Environment variable usage
- Container communication

### 5. [05_GITHUB_ACTIONS.md](./05_GITHUB_ACTIONS.md)
**GitHub Actions CI/CD workflow explained**
- Workflow triggers
- SSH deployment
- Automated build and deploy
- Setting up secrets
- Troubleshooting

### 6. [06_ENVIRONMENT_VARIABLES.md](./06_ENVIRONMENT_VARIABLES.md)
**Complete environment variables guide**
- All required variables
- How to set them
- Security best practices
- Troubleshooting

### 7. [07_MANUAL_DEPLOYMENT.md](./07_MANUAL_DEPLOYMENT.md)
**Manual deployment guide (step-by-step)**
- Initial server setup
- Manual deployment process
- Updating deployments manually
- Maintenance commands
- Troubleshooting

### 8. [08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)
**Automated deployment with CI/CD**
- Initial server setup for automation
- Setting up GitHub Actions
- SSH key configuration
- Automated deployment workflow
- Troubleshooting CI/CD

### 9. [09_HTTPS_SETUP.md](./09_HTTPS_SETUP.md)
**HTTPS/SSL setup with Let's Encrypt**
- Domain name and DNS configuration
- Installing Nginx reverse proxy
- Getting SSL certificates with Certbot
- Configuring HTTPS
- Automatic certificate renewal
- Security best practices

### 10. [10_CLIENT_NGINX_CONFIG.md](./10_CLIENT_NGINX_CONFIG.md)
**Client Nginx configuration explained**
- Complete line-by-line explanation
- React Router SPA routing support
- Gzip compression configuration
- Static asset caching
- Troubleshooting common issues
- Best practices

## 🚀 Quick Start

**Choose your deployment method:**

1. **Manual Deployment** → Start with [07_MANUAL_DEPLOYMENT.md](./07_MANUAL_DEPLOYMENT.md)
2. **Automated Deployment (CI/CD)** → Start with [08_AUTOMATED_DEPLOYMENT.md](./08_AUTOMATED_DEPLOYMENT.md)

**Understanding the components:**
- **Docker?** Read files 02, 03, and 04
- **Client Nginx config?** See [10_CLIENT_NGINX_CONFIG.md](./10_CLIENT_NGINX_CONFIG.md)
- **CI/CD workflow?** Check [05_GITHUB_ACTIONS.md](./05_GITHUB_ACTIONS.md)
- **Environment variables?** See [06_ENVIRONMENT_VARIABLES.md](./06_ENVIRONMENT_VARIABLES.md)

## 📖 Reading Order

**For beginners:**
1. Choose: 07_MANUAL_DEPLOYMENT.md OR 08_AUTOMATED_DEPLOYMENT.md (deployment method)
2. 06_ENVIRONMENT_VARIABLES.md (configuration)
3. 02_CLIENT_DOCKERFILE.md (understand frontend)
4. 03_SERVER_DOCKERFILE.md (understand backend)
5. 04_DOCKER_COMPOSE.md (how they work together)
6. 05_GITHUB_ACTIONS.md (CI/CD details - if using automation)

**For experienced developers:**
- Jump to specific files as needed
- Use as reference documentation

## 🔍 Finding Information

**Looking for:**
- **Manual deployment?** → 07_MANUAL_DEPLOYMENT.md
- **Automated deployment (CI/CD)?** → 08_AUTOMATED_DEPLOYMENT.md
- **HTTPS/SSL setup?** → 09_HTTPS_SETUP.md
- **Client Nginx configuration?** → 10_CLIENT_NGINX_CONFIG.md
- **What does Dockerfile do?** → 02_CLIENT_DOCKERFILE.md or 03_SERVER_DOCKERFILE.md
- **How containers communicate?** → 04_DOCKER_COMPOSE.md
- **How CI/CD workflow works?** → 05_GITHUB_ACTIONS.md
- **What variables to set?** → 06_ENVIRONMENT_VARIABLES.md

## 💡 Tips

- All documents use simple, clear language
- Step-by-step explanations for each concept
- Troubleshooting sections in each document
- Examples and code snippets included

## 🆘 Need Help?

1. Check the troubleshooting section in relevant document
2. Review the deployment guide for common issues
3. Verify environment variables are set correctly
4. Check Docker and docker-compose are installed
5. Verify GitHub secrets are configured

## 📝 Notes

- All paths assume deployment to `/var/www/node-react-rbac`
- Server IP: 139.59.6.209 (update if different)
- Default ports: 3001 (frontend), 5000 (backend)
- HTTPS setup requires a domain name (see 09_HTTPS_SETUP.md)
- Adjust values as needed for your setup

