# Kubernetes Deployment Guide

This guide explains how to deploy the Node-React-RBAC application to Kubernetes using ingress-nginx.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)
5. [CI/CD Setup](#cicd-setup)
6. [Detailed Documentation](#detailed-documentation)
7. [Troubleshooting](#troubleshooting)

## Overview

This application has been migrated from Docker Compose to Kubernetes. The setup includes:
- **Server**: Node.js backend API (2 replicas)
- **Client**: React frontend served by Nginx (2 replicas)
- **Ingress**: ingress-nginx for routing traffic
- **CI/CD**: Automated deployment via GitHub Actions

## Prerequisites

1. **Kubernetes Cluster**: A running Kubernetes cluster (v1.20+)
2. **kubectl**: Kubernetes command-line tool configured to access your cluster
3. **Docker Registry**: Access to a container registry (Docker Hub, GitHub Container Registry, etc.)
4. **ingress-nginx**: Ingress controller installed in your cluster

### Installing ingress-nginx

If you don't have ingress-nginx installed:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

Or using Helm:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx
```

## Architecture

```
Internet
   |
   v
[ingress-nginx]
   |
   +-- /api/*  --> [Server Service] --> [Server Pods (2 replicas)]
   |
   +-- /*      --> [Client Service] --> [Client Pods (2 replicas)]
```

### Components

- **Namespace**: `node-react-rbac` - Isolates all application resources
- **ConfigMap**: Stores non-sensitive configuration (NODE_ENV, PORT)
- **Secret**: Stores sensitive data (MONGODB_URI, JWT_SECRET)
- **Server Deployment**: Runs 2 replicas of the Node.js backend
- **Client Deployment**: Runs 2 replicas of the React frontend
- **Ingress**: Routes external traffic to appropriate services

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build server image
cd server
docker build -t your-registry/node-react-rbac-server:latest .
docker push your-registry/node-react-rbac-server:latest

# Build client image
cd ../client
docker build -t your-registry/node-react-rbac-client:latest --build-arg REACT_APP_API_URL=/api .
docker push your-registry/node-react-rbac-client:latest
```

### 2. Update Image Names

Edit `k8s/server-deployment.yaml` and `k8s/client-deployment.yaml`:
- Replace `your-registry/node-react-rbac-server:latest` with your actual image
- Replace `your-registry/node-react-rbac-client:latest` with your actual image

### 3. Create Secret

```bash
kubectl create secret generic app-secrets \
  --namespace=node-react-rbac \
  --from-literal=MONGODB_URI='your-mongodb-uri' \
  --from-literal=JWT_SECRET='your-jwt-secret'
```

### 4. Deploy

```bash
kubectl apply -f k8s/
```

### 5. Verify

```bash
# Check all resources
kubectl get all -n node-react-rbac

# Get ingress IP
kubectl get ingress -n node-react-rbac
```

## CI/CD Setup

The GitHub Actions workflow automatically:
1. Builds Docker images on push to main
2. Pushes images to container registry
3. Deploys to Kubernetes cluster
4. Updates deployments with new images

### Required GitHub Secrets

- `KUBE_CONFIG`: Base64 encoded kubeconfig file
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `GITHUB_TOKEN`: Automatically provided (for ghcr.io)
- Or `DOCKER_USERNAME` and `DOCKER_PASSWORD` for Docker Hub

See [02_CI_CD_SETUP.md](./02_CI_CD_SETUP.md) for detailed setup instructions.

## Detailed Documentation

- **[01_QUICK_START.md](./01_QUICK_START.md)**: 5-minute deployment guide
- **[02_CI_CD_SETUP.md](./02_CI_CD_SETUP.md)**: Complete CI/CD setup guide
- **[03_KUBERNETES_MANIFESTS.md](./03_KUBERNETES_MANIFESTS.md)**: Manifest files explained
- **[04_TROUBLESHOOTING.md](./04_TROUBLESHOOTING.md)**: Common issues and solutions
- **[05_DEPLOYMENT_SCRIPT.md](./05_DEPLOYMENT_SCRIPT.md)**: Helper scripts
- **[06_MIGRATION_FROM_DOCKER_COMPOSE.md](./06_MIGRATION_FROM_DOCKER_COMPOSE.md)**: Migration guide

## Troubleshooting

### Quick Checks

```bash
# Check pod status
kubectl get pods -n node-react-rbac

# Check logs
kubectl logs -f deployment/server -n node-react-rbac
kubectl logs -f deployment/client -n node-react-rbac

# Check service endpoints
kubectl get endpoints -n node-react-rbac

# Check ingress
kubectl describe ingress app-ingress -n node-react-rbac
```

### Common Issues

1. **Pods in ImagePullBackOff**: Update image names in deployment files
2. **Service not accessible**: Check service endpoints and pod labels
3. **Ingress not working**: Verify ingress-nginx controller is running
4. **503 errors**: Check backend service has endpoints

See [04_TROUBLESHOOTING.md](./04_TROUBLESHOOTING.md) for detailed troubleshooting.

## Scaling

### Manual Scaling

```bash
kubectl scale deployment server -n node-react-rbac --replicas=3
kubectl scale deployment client -n node-react-rbac --replicas=3
```

### Auto Scaling (HPA)

See [03_KUBERNETES_MANIFESTS.md](./03_KUBERNETES_MANIFESTS.md) for HorizontalPodAutoscaler setup.

## Differences from Docker Compose

1. **Networking**: Kubernetes uses Services instead of Docker networks
2. **Routing**: ingress-nginx handles routing instead of client's nginx
3. **Scaling**: Easy horizontal scaling with replicas
4. **Health Checks**: Built-in liveness and readiness probes
5. **Resource Management**: CPU and memory limits/requests
6. **Configuration**: ConfigMaps and Secrets instead of environment variables

## Clean Up

To remove all resources:

```bash
kubectl delete namespace node-react-rbac
```

Or delete individual resources:

```bash
kubectl delete -f k8s/
```

## Next Steps

1. Set up CI/CD pipeline (see [02_CI_CD_SETUP.md](./02_CI_CD_SETUP.md))
2. Configure domain name and SSL/TLS
3. Set up monitoring and logging
4. Configure auto-scaling
5. Set up backup strategies
