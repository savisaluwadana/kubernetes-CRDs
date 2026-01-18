#!/bin/bash

# Cleanup script - removes all deployed resources

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Cleanup Product Management${NC}"
echo -e "${YELLOW}================================${NC}"
echo

# Ask for confirmation
read -p "This will delete all resources. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 1
fi

# Delete Kubernetes resources
echo -e "${YELLOW}Deleting Kubernetes resources...${NC}"
kubectl delete namespace product-management 2>/dev/null || echo "Namespace already deleted"
echo -e "${GREEN}✅ Kubernetes resources deleted${NC}"

# Docker Compose cleanup
echo -e "${YELLOW}Stopping Docker Compose services...${NC}"
docker-compose down -v 2>/dev/null || echo "No Docker Compose services running"
echo -e "${GREEN}✅ Docker Compose cleaned up${NC}"

# Clean Docker images (optional)
read -p "Do you want to remove Docker images? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing Docker images...${NC}"
    docker rmi product-backend:latest 2>/dev/null || true
    docker rmi product-frontend:latest 2>/dev/null || true
    echo -e "${GREEN}✅ Docker images removed${NC}"
fi

# Stop Colima (optional)
read -p "Do you want to stop Colima? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping Colima...${NC}"
    colima stop
    echo -e "${GREEN}✅ Colima stopped${NC}"
fi

echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Cleanup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo
