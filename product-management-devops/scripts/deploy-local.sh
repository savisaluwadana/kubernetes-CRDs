#!/bin/bash

# Local Deployment Script for Colima + Kubernetes
# This script sets up the entire Product Management System on your local machine

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Product Management Local Deploy${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v colima &> /dev/null; then
    echo -e "${RED}❌ Colima is not installed${NC}"
    echo "Install with: brew install colima"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Install with: brew install docker"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    echo "Install with: brew install kubectl"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo

# Check if Colima is running
echo -e "${YELLOW}Checking Colima status...${NC}"
if ! colima status &> /dev/null; then
    echo -e "${YELLOW}Starting Colima with Kubernetes...${NC}"
    colima start --kubernetes --cpu 4 --memory 8 --disk 50
    echo -e "${GREEN}✅ Colima started${NC}"
else
    echo -e "${GREEN}✅ Colima is already running${NC}"
fi
echo

# Verify Kubernetes
echo -e "${YELLOW}Verifying Kubernetes cluster...${NC}"
kubectl cluster-info
echo -e "${GREEN}✅ Kubernetes cluster is ready${NC}"
echo

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
echo "Building backend..."
docker build -t product-backend:latest ./backend
echo "Building frontend..."
docker build -t product-frontend:latest ./frontend
echo -e "${GREEN}✅ Images built successfully${NC}"
echo

# Deploy to Kubernetes
echo -e "${YELLOW}Deploying to Kubernetes...${NC}"

echo "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "Creating ConfigMaps and Secrets..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

echo "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml

echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n product-management --timeout=300s

echo "Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml

echo "Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

echo "Applying HPA..."
kubectl apply -f k8s/hpa.yaml

echo -e "${GREEN}✅ All resources deployed${NC}"
echo

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment/backend -n product-management --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n product-management --timeout=300s
echo -e "${GREEN}✅ All deployments are ready${NC}"
echo

# Display status
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Deployment Status${NC}"
echo -e "${BLUE}================================${NC}"
echo
kubectl get pods -n product-management
echo
kubectl get svc -n product-management
echo

# Instructions
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo -e "${YELLOW}Access your application:${NC}"
echo
echo "1. Frontend:"
echo "   kubectl port-forward svc/frontend-service 3000:80 -n product-management"
echo "   Then visit: http://localhost:3000"
echo
echo "2. Backend API:"
echo "   kubectl port-forward svc/backend-service 5000:5000 -n product-management"
echo "   Then visit: http://localhost:5000/health"
echo
echo -e "${YELLOW}Useful commands:${NC}"
echo
echo "View logs:"
echo "  kubectl logs -f deployment/backend -n product-management"
echo "  kubectl logs -f deployment/frontend -n product-management"
echo
echo "Scale deployment:"
echo "  kubectl scale deployment backend --replicas=3 -n product-management"
echo
echo "Delete deployment:"
echo "  kubectl delete namespace product-management"
echo
echo "Stop Colima:"
echo "  colima stop"
echo
