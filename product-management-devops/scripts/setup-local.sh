#!/bin/bash

# Setup script for local development environment
# Installs all necessary tools for macOS

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Local Environment Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew already installed${NC}"
fi

# Update Homebrew
echo -e "${YELLOW}Updating Homebrew...${NC}"
brew update

# Install Colima
if ! command -v colima &> /dev/null; then
    echo -e "${YELLOW}Installing Colima...${NC}"
    brew install colima
else
    echo -e "${GREEN}✅ Colima already installed${NC}"
fi

# Install Docker CLI
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker CLI...${NC}"
    brew install docker
else
    echo -e "${GREEN}✅ Docker CLI already installed${NC}"
fi

# Install kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}Installing kubectl...${NC}"
    brew install kubectl
else
    echo -e "${GREEN}✅ kubectl already installed${NC}"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    brew install node@18
    brew link node@18
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Install Ansible (optional)
if ! command -v ansible &> /dev/null; then
    echo -e "${YELLOW}Installing Ansible...${NC}"
    brew install ansible
else
    echo -e "${GREEN}✅ Ansible already installed${NC}"
fi

# Install Helm (optional)
if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}Installing Helm...${NC}"
    brew install helm
else
    echo -e "${GREEN}✅ Helm already installed${NC}"
fi

echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo -e "${YELLOW}Installed tools:${NC}"
echo "  - Colima: $(colima version 2>/dev/null || echo 'installed')"
echo "  - Docker: $(docker --version)"
echo "  - kubectl: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Ansible: $(ansible --version | head -n1)"
echo "  - Helm: $(helm version --short 2>/dev/null || echo 'installed')"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Start Colima: colima start --kubernetes --cpu 4 --memory 8"
echo "2. Navigate to project: cd product-management-devops"
echo "3. Deploy: ./scripts/deploy-local.sh"
echo
