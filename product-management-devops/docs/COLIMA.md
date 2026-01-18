# Local Development with Colima

This project is configured for **local development using Colima** - a container runtime for macOS that provides Docker and Kubernetes functionality.

## Why Colima?

- ✅ Lightweight and fast
- ✅ Built-in Kubernetes support
- ✅ macOS native (uses Apple's Virtualization framework)
- ✅ Docker compatible
- ✅ Free and open source

## Quick Start

### 1. Install Prerequisites

```bash
# Run the setup script (installs everything)
./scripts/setup-local.sh

# Or install manually:
brew install colima docker kubectl node@18
```

### 2. Start Colima

```bash
# Start with Kubernetes enabled
colima start --kubernetes --cpu 4 --memory 8 --disk 50

# Verify
colima status
kubectl cluster-info
```

### 3. Deploy Application

Choose one method:

**Option A: Kubernetes (Recommended)**
```bash
./scripts/deploy-local.sh
```

**Option B: Docker Compose (Simpler)**
```bash
docker-compose up -d
```

**Option C: Ansible**
```bash
cd ansible
ansible-playbook -i inventory/local.ini playbooks/deploy-local.yml
```

### 4. Access Application

**With Kubernetes:**
```bash
# Port forward
kubectl port-forward svc/frontend-service 3000:80 -n product-management

# Access
open http://localhost:3000
```

**With Docker Compose:**
```bash
# Already accessible at:
open http://localhost:3000  # Frontend
open http://localhost:5000  # Backend
```

## Colima Commands

```bash
# Start
colima start --kubernetes

# Start with custom resources
colima start --kubernetes --cpu 4 --memory 8 --disk 50

# Stop
colima stop

# Status
colima status

# Delete (clean slate)
colima delete

# SSH into VM
colima ssh

# List running instances
colima list
```

## Configuration

### Recommended Colima Settings

```bash
colima start \
  --kubernetes \
  --cpu 4 \
  --memory 8 \
  --disk 50 \
  --kubernetes-version v1.28.3 \
  --vm-type vz \
  --mount-type virtiofs
```

**Settings explained:**
- `--kubernetes`: Enable Kubernetes
- `--cpu 4`: Allocate 4 CPU cores
- `--memory 8`: Allocate 8GB RAM
- `--disk 50`: Allocate 50GB disk
- `--vm-type vz`: Use Apple Virtualization (faster)
- `--mount-type virtiofs`: Better file sharing performance

### Adjust for Your Machine

**For lower-end Macs:**
```bash
colima start --kubernetes --cpu 2 --memory 4 --disk 30
```

**For higher-end Macs:**
```bash
colima start --kubernetes --cpu 8 --memory 16 --disk 100
```

## Development Workflow

### 1. Code, Build, Deploy

```bash
# Make changes to code
vim backend/server.js

# Rebuild image
docker build -t product-backend:latest ./backend

# Update in Kubernetes
kubectl rollout restart deployment/backend -n product-management

# View logs
kubectl logs -f deployment/backend -n product-management
```

### 2. Quick Testing with Docker Compose

```bash
# Start
docker-compose up -d

# Make changes
vim backend/routes/products.js

# Rebuild and restart
docker-compose up -d --build backend

# View logs
docker-compose logs -f backend
```

## Kubernetes on Colima

### Access Services

**Method 1: Port Forwarding (Recommended)**
```bash
kubectl port-forward svc/frontend-service 3000:80 -n product-management
kubectl port-forward svc/backend-service 5000:5000 -n product-management
```

**Method 2: NodePort**
```bash
# Edit service to use NodePort
kubectl edit svc frontend-service -n product-management
# Change type to: NodePort

# Get the port
kubectl get svc frontend-service -n product-management
# Access via: http://localhost:<nodeport>
```

### Useful Commands

```bash
# View all resources
kubectl get all -n product-management

# Watch pods
kubectl get pods -n product-management -w

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n product-management

# Exec into pod
kubectl exec -it deployment/backend -n product-management -- sh

# View logs
kubectl logs -f deployment/backend -n product-management
kubectl logs -f deployment/frontend -n product-management
kubectl logs -f deployment/postgres -n product-management

# Scale deployment
kubectl scale deployment backend --replicas=3 -n product-management

# Delete and redeploy
kubectl delete -f k8s/
kubectl apply -f k8s/
```

## Troubleshooting

### Colima Issues

**Colima won't start:**
```bash
colima delete
colima start --kubernetes
```

**Out of resources:**
```bash
# Check status
colima status

# Restart with more resources
colima stop
colima start --kubernetes --cpu 4 --memory 8
```

**Docker context issues:**
```bash
# Check context
docker context ls

# Use Colima context
docker context use colima
```

### Kubernetes Issues

**Pods not starting:**
```bash
# Check events
kubectl get events -n product-management --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n product-management

# Check logs
kubectl logs <pod-name> -n product-management
```

**Image pull errors:**
```bash
# Verify images exist
docker images | grep product

# Rebuild images
docker build -t product-backend:latest ./backend
docker build -t product-frontend:latest ./frontend

# Images are automatically available in Colima's K8s
```

**Service not accessible:**
```bash
# Check service
kubectl get svc -n product-management

# Check endpoints
kubectl get endpoints -n product-management

# Use port-forward
kubectl port-forward svc/frontend-service 3000:80 -n product-management
```

### Database Issues

**Can't connect to database:**
```bash
# Check PostgreSQL pod
kubectl get pods -n product-management | grep postgres

# View logs
kubectl logs -f deployment/postgres -n product-management

# Exec into database
kubectl exec -it deployment/postgres -n product-management -- psql -U postgres -d productdb

# Test connection from backend
kubectl exec -it deployment/backend -n product-management -- sh
# Then: nc -zv postgres-service 5432
```

### Performance Issues

**Application is slow:**
```bash
# Check resource usage
kubectl top pods -n product-management
kubectl top nodes

# Increase Colima resources
colima stop
colima start --kubernetes --cpu 6 --memory 12

# Scale down replicas if needed
kubectl scale deployment backend --replicas=1 -n product-management
```

## Cleanup

### Partial Cleanup
```bash
# Delete Kubernetes resources only
kubectl delete namespace product-management

# Or use script
./scripts/cleanup.sh
```

### Full Cleanup
```bash
# Stop Colima
colima stop

# Delete everything
colima delete

# This removes:
# - All containers
# - All images
# - All volumes
# - The VM itself
```

## Tips & Best Practices

1. **Resource Management**
   - Don't over-allocate resources to Colima
   - Leave at least 4GB RAM for macOS
   - Monitor with `colima status`

2. **Image Management**
   - Images built with Docker are automatically available in K8s
   - Use `imagePullPolicy: IfNotPresent` in deployments
   - Clean up unused images: `docker image prune`

3. **Development**
   - Use Docker Compose for quick iterations
   - Use Kubernetes for testing real deployments
   - Keep Colima running to avoid startup delays

4. **Persistence**
   - Colima data persists across restarts
   - `colima delete` removes ALL data
   - Back up important data before deleting

5. **Networking**
   - Use port-forward for accessing services
   - Services are isolated within the Colima VM
   - Use LoadBalancer type for automatic exposure

## Next Steps

- ✅ Install: `./scripts/setup-local.sh`
- ✅ Deploy: `./scripts/deploy-local.sh`
- ✅ Access: `kubectl port-forward svc/frontend-service 3000:80 -n product-management`
- ✅ Develop: Make changes, rebuild, redeploy
- ✅ Monitor: View logs and metrics
- ✅ Scale: Test auto-scaling and high availability

---

Happy local development! 🚀
