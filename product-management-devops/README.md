# 🚀 Product Management System - Full-Stack DevOps Demo

A complete end-to-end DevOps implementation showcasing modern cloud-native application development, containerization, orchestration, infrastructure as code, configuration management, and CI/CD pipelines.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Infrastructure Provisioning](#infrastructure-provisioning)
- [Configuration Management](#configuration-management)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Observability](#monitoring--observability)
- [Security](#security)
- [Contributing](#contributing)

## 🎯 Overview

This project demonstrates a production-grade Product Management System built with:
- **Frontend**: React.js with modern hooks and routing
- **Backend**: Express.js REST API with Sequelize ORM
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes with auto-scaling
- **IaC**: Terraform for AWS infrastructure
- **Configuration Management**: Ansible playbooks
- **CI/CD**: GitHub Actions workflows
- **Monitoring**: Prometheus & Grafana

## 🛠️ Tech Stack

### Application
- **Frontend**: React 18, React Router, React Query, Axios, Lucide Icons
- **Backend**: Node.js, Express.js, Sequelize, PostgreSQL
- **Database**: PostgreSQL 15

### DevOps
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes, Helm
- **IaC**: Terraform (AWS VPC, EKS, RDS)
- **Configuration**: Ansible
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Security**: Trivy vulnerability scanning

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI/CD                     │
│  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌──────────┐   │
│  │   Test   │→ │   Build   │→ │  Scan   │→ │  Deploy  │   │
│  └──────────┘  └───────────┘  └─────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    AWS Cloud (Terraform)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     VPC Network                       │  │
│  │  ┌─────────────┐           ┌─────────────┐          │  │
│  │  │   Public    │           │   Private   │          │  │
│  │  │   Subnets   │           │   Subnets   │          │  │
│  │  │  (NAT GW)   │           │  (EKS/RDS)  │          │  │
│  │  └─────────────┘           └─────────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────┐              ┌──────────────────┐      │
│  │   EKS Cluster  │              │   RDS Postgres   │      │
│  │  ┌──────────┐  │              │   (Multi-AZ)     │      │
│  │  │ Frontend │  │              └──────────────────┘      │
│  │  │ (React)  │  │                                         │
│  │  └──────────┘  │                                         │
│  │  ┌──────────┐  │                                         │
│  │  │ Backend  │─────────────────→  PostgreSQL             │
│  │  │(Express) │  │                                         │
│  │  └──────────┘  │                                         │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
product-management-devops/
├── backend/                    # Express.js API
│   ├── config/                 # Database configuration
│   ├── models/                 # Sequelize models
│   ├── routes/                 # API routes
│   ├── server.js               # Entry point
│   ├── Dockerfile              # Backend container
│   └── package.json
│
├── frontend/                   # React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API services
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile              # Frontend container
│   ├── nginx.conf              # Nginx configuration
│   └── package.json
│
├── k8s/                        # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── postgres-pvc.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
│
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # Provider configuration
│   ├── variables.tf            # Input variables
│   ├── vpc.tf                  # VPC resources
│   ├── eks.tf                  # EKS cluster
│   ├── rds.tf                  # RDS database
│   └── outputs.tf              # Output values
│
├── ansible/                    # Configuration management
│   ├── ansible.cfg
│   ├── inventory/
│   │   └── hosts.ini
│   ├── playbooks/
│   │   └── deploy.yml
│   └── roles/
│       ├── common/
│       ├── docker/
│       ├── kubernetes/
│       ├── deploy-app/
│       └── monitoring/
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│       ├── ci-cd.yml           # Main pipeline
│       ├── terraform.yml       # Infrastructure pipeline
│       └── ansible.yml         # Deployment pipeline
│
├── docker-compose.yml          # Local development
└── README.md
```

## ✅ Prerequisites

### Local Development
- Node.js 18+ 
- Docker & Docker Compose
- kubectl
- Git

### AWS Deployment
- AWS CLI configured
- Terraform 1.0+
- kubectl
- Ansible 2.9+

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/product-management-devops.git
cd product-management-devops
```

### 2. Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Database: localhost:5432
```

### 3. Stop Services

```bash
docker-compose down
docker-compose down -v  # Remove volumes
```

## 💻 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials

# Start development server
npm run dev

# Run tests
npm test
```

**Backend API Endpoints:**
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🐳 Docker Deployment

### Build Images

```bash
# Build backend
docker build -t product-backend:latest ./backend

# Build frontend
docker build -t product-frontend:latest ./frontend
```

### Run with Docker Compose

```bash
docker-compose up -d
```

**Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api
- PostgreSQL: localhost:5432

## ☸️ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
# macOS
brew install kubectl

# Verify cluster access
kubectl cluster-info
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy ConfigMaps and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n product-management --timeout=300s

# Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy HPA (Horizontal Pod Autoscaler)
kubectl apply -f k8s/hpa.yaml

# Optional: Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n product-management

# Check services
kubectl get svc -n product-management

# Get frontend URL
kubectl get svc frontend-service -n product-management

# View logs
kubectl logs -f deployment/backend -n product-management
kubectl logs -f deployment/frontend -n product-management
```

### Update Deployment

```bash
# Update image
kubectl set image deployment/backend backend=product-backend:v2 -n product-management

# Rollback
kubectl rollout undo deployment/backend -n product-management

# View rollout status
kubectl rollout status deployment/backend -n product-management
```

## 🏗️ Infrastructure Provisioning

### Terraform Setup

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values

# Set database password as environment variable
export TF_VAR_db_password="your-secure-password"
```

### Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# Configure kubectl for EKS
aws eks update-kubeconfig --region us-east-1 --name product-management-eks
```

### Infrastructure Components

The Terraform configuration creates:
- **VPC** with public and private subnets across 2 AZs
- **NAT Gateways** for private subnet internet access
- **EKS Cluster** with managed node groups
- **RDS PostgreSQL** instance (Multi-AZ)
- **Security Groups** with least privilege access
- **IAM Roles** and policies for EKS

### Destroy Infrastructure

```bash
terraform destroy
```

## ⚙️ Configuration Management

### Ansible Setup

```bash
cd ansible

# Install Ansible
pip install ansible kubernetes

# Update inventory
vi inventory/hosts.ini  # Add your server IPs
```

### Deploy with Ansible

```bash
# Test connectivity
ansible all -m ping

# Deploy everything
ansible-playbook playbooks/deploy.yml

# Deploy specific role
ansible-playbook playbooks/deploy.yml --tags docker

# Dry run
ansible-playbook playbooks/deploy.yml --check
```

### Ansible Roles

- **common**: System setup and configuration
- **docker**: Docker installation and configuration
- **kubernetes**: K8s cluster setup
- **deploy-app**: Application deployment
- **monitoring**: Prometheus & Grafana setup

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Triggers on push to `main` or `develop`:

1. **Test Backend** - Run backend tests
2. **Test Frontend** - Run frontend tests
3. **Build & Push** - Build and push Docker images to GHCR
4. **Deploy to K8s** - Deploy to Kubernetes cluster
5. **Security Scan** - Trivy vulnerability scanning

#### 2. Terraform Pipeline (`.github/workflows/terraform.yml`)

Manages infrastructure:
- **Plan**: On PR, shows planned changes
- **Apply**: On merge to main, applies changes

#### 3. Ansible Pipeline (`.github/workflows/ansible.yml`)

Manual deployment trigger:
- Deploy to staging or production
- Run Ansible playbooks

### Required Secrets

Configure these in GitHub Settings → Secrets:

```
AWS_ACCESS_KEY_ID          # AWS credentials
AWS_SECRET_ACCESS_KEY      # AWS credentials
KUBE_CONFIG                # Kubernetes config
DB_PASSWORD                # Database password
SSH_PRIVATE_KEY            # Ansible SSH key
```

### Workflow Usage

```bash
# Automatically triggered on push
git push origin main

# Manual Ansible deployment
# Go to Actions → Ansible Deploy → Run workflow
# Select environment (staging/production)
```

## 📊 Monitoring & Observability

### Prometheus & Grafana

Deployed via Ansible:

```bash
# Deploy monitoring stack
ansible-playbook playbooks/deploy.yml --tags monitoring

# Get Grafana URL
kubectl get svc prometheus-grafana -n monitoring
```

**Default Credentials:**
- Username: `admin`
- Password: `admin` (change on first login)

### Key Metrics

- **Application Metrics**: Request rate, latency, error rate
- **Container Metrics**: CPU, memory, network
- **Database Metrics**: Connections, queries, performance
- **Cluster Metrics**: Node status, pod health

### Logs

```bash
# Application logs
kubectl logs -f deployment/backend -n product-management

# Stream logs from all pods
kubectl logs -f -l app=backend -n product-management

# Previous container logs
kubectl logs deployment/backend --previous -n product-management
```

## 🔒 Security

### Best Practices Implemented

1. **Container Security**
   - Non-root users in containers
   - Minimal base images (Alpine)
   - Multi-stage builds
   - Regular vulnerability scanning with Trivy

2. **Kubernetes Security**
   - Network policies
   - RBAC enabled
   - Secrets for sensitive data
   - Resource limits and quotas
   - Pod security policies

3. **Infrastructure Security**
   - Private subnets for workloads
   - Security groups with minimal access
   - Encrypted RDS storage
   - VPC isolation
   - IAM roles with least privilege

4. **Application Security**
   - Environment-based configuration
   - CORS protection
   - Helmet.js security headers
   - Input validation
   - SQL injection protection (ORM)

### Security Scanning

```bash
# Scan Docker images
docker scan product-backend:latest
docker scan product-frontend:latest

# Trivy scanning
trivy image product-backend:latest
trivy image product-frontend:latest
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Tests

```bash
# Ensure services are running
docker-compose up -d

# Run integration tests (when implemented)
npm run test:integration
```

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL is running
kubectl get pods -n product-management | grep postgres

# Check connection details
kubectl describe pod postgres-xxx -n product-management
```

**2. Image Pull Errors**
```bash
# Check image exists
docker images | grep product

# Re-build image
docker build -t product-backend:latest ./backend
```

**3. Pod CrashLoopBackOff**
```bash
# Check logs
kubectl logs pod-name -n product-management

# Describe pod
kubectl describe pod pod-name -n product-management
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible Documentation](https://docs.ansible.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- Express.js community
- React community
- Kubernetes community
- Cloud Native Computing Foundation

---

**Happy Coding! 🚀**

For questions or issues, please open an issue on GitHub.
