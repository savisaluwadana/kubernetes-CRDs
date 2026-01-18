# Product Management DevOps - Quick Reference

## Quick Commands

### Docker Compose
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f
```

### Kubernetes
```bash
# Deploy
kubectl apply -f k8s/

# Status
kubectl get all -n product-management

# Logs
kubectl logs -f deployment/backend -n product-management

# Scale
kubectl scale deployment backend --replicas=3 -n product-management

# Port forward
kubectl port-forward svc/frontend-service 8080:80 -n product-management
```

### Terraform
```bash
# Plan
terraform plan

# Apply
terraform apply -auto-approve

# Destroy
terraform destroy -auto-approve

# Output
terraform output
```

### Ansible
```bash
# Ping
ansible all -m ping

# Deploy
ansible-playbook playbooks/deploy.yml

# Specific role
ansible-playbook playbooks/deploy.yml --tags docker
```

## Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **PostgreSQL**: localhost:5432

## Default Credentials

- **Database**: postgres/postgres
- **Grafana**: admin/admin

## Troubleshooting

```bash
# Check backend logs
docker-compose logs backend

# Reset database
docker-compose down -v
docker-compose up -d

# Rebuild images
docker-compose build --no-cache

# Check Kubernetes pod logs
kubectl logs -f <pod-name> -n product-management

# Describe failing pod
kubectl describe pod <pod-name> -n product-management
```
