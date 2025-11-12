#!/bin/bash

# PubliCenter Initial Setup Script
# This script automates the initial server setup for PubliCenter

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting PubliCenter setup..."
echo ""

# ============================================
# STEP 1: System Update
# ============================================
print_info "Step 1/8: Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"
echo ""

# ============================================
# STEP 2: Install Docker
# ============================================
print_info "Step 2/8: Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Add current user to docker group
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        print_success "Docker installed and $SUDO_USER added to docker group"
    else
        print_success "Docker installed"
    fi
else
    print_warning "Docker already installed"
fi
echo ""

# ============================================
# STEP 3: Install Docker Compose
# ============================================
print_info "Step 3/8: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed (${DOCKER_COMPOSE_VERSION})"
else
    print_warning "Docker Compose already installed"
fi
echo ""

# ============================================
# STEP 4: Install Additional Tools
# ============================================
print_info "Step 4/8: Installing additional tools..."
apt install -y git curl wget nano ufw openssl
print_success "Additional tools installed"
echo ""

# ============================================
# STEP 5: Configure Firewall
# ============================================
print_info "Step 5/8: Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
print_success "Firewall configured"
echo ""

# ============================================
# STEP 6: Create Project Directory
# ============================================
print_info "Step 6/8: Creating project directory..."
PROJECT_DIR="/opt/publicenter"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR
print_success "Project directory created: $PROJECT_DIR"
echo ""

# ============================================
# STEP 7: Configure Environment
# ============================================
print_info "Step 7/8: Configuring environment variables..."
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        print_info "Keeping existing .env file"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != true ]; then
    # Collect user input
    read -p "Enter your domain name (e.g., publicenter.com): " DOMAIN
    read -p "Enter your email for SSL certificates: " ADMIN_EMAIL
    echo ""

    read -p "Enter your WordPress URL (e.g., https://yoursite.com): " WORDPRESS_URL
    read -p "Enter your WordPress username: " WORDPRESS_USERNAME
    read -sp "Enter your WordPress Application Password: " WORDPRESS_APP_PASSWORD
    echo ""
    echo ""

    read -sp "Enter your Google Translate API Key: " GOOGLE_TRANSLATE_API_KEY
    echo ""
    echo ""

    # Generate secure passwords
    print_info "Generating secure passwords..."
    DB_PASSWORD=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    # Create .env file
    cat > .env << EOF
# Database Configuration
DB_USER=publicenter
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=publicenter

# WordPress Configuration
WORDPRESS_URL=${WORDPRESS_URL}
WORDPRESS_USERNAME=${WORDPRESS_USERNAME}
WORDPRESS_APP_PASSWORD=${WORDPRESS_APP_PASSWORD}

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}

# Application Configuration
APP_URL=https://${DOMAIN}
DOMAIN=${DOMAIN}
ADMIN_EMAIL=${ADMIN_EMAIL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NODE_ENV=production

# Rate Limiting
API_RATE_LIMIT=100

# Cache Settings
CACHE_TTL=300
EOF

    chmod 600 .env
    print_success "Environment configured"
    echo ""

    # Save credentials to a secure file
    cat > credentials.txt << EOF
========================================
PubliCenter Credentials
========================================
Generated: $(date)

Database Password: ${DB_PASSWORD}
NextAuth Secret: ${NEXTAUTH_SECRET}

IMPORTANT: Store these credentials securely!
Delete this file after saving the credentials.
========================================
EOF
    chmod 600 credentials.txt
    print_warning "Credentials saved to: ${PROJECT_DIR}/credentials.txt"
    print_warning "Please save these credentials and delete the file!"
else
    echo ""
fi

# ============================================
# STEP 8: Create SSL Directory
# ============================================
print_info "Step 8/8: Creating SSL certificate directory..."
mkdir -p ./letsencrypt
chmod 755 ./letsencrypt
print_success "SSL directory created"
echo ""

# Create backups directory
mkdir -p ./backups
chmod 755 ./backups
print_success "Backups directory created"
echo ""

# ============================================
# Summary
# ============================================
echo ""
print_success "========================================="
print_success "PubliCenter Setup Complete!"
print_success "========================================="
echo ""
print_info "Next steps:"
echo "  1. Clone/upload your code to: $PROJECT_DIR"
echo "     git clone https://github.com/yourusername/publicenter.git ."
echo ""
echo "  2. Build Docker containers:"
echo "     docker-compose build"
echo ""
echo "  3. Start services:"
echo "     docker-compose up -d"
echo ""
if [ "$SKIP_ENV" != true ]; then
    echo "  4. Configure DNS: Point ${DOMAIN} to this server's IP"
    echo ""
    echo "  5. Wait 2-3 minutes for SSL certificate generation"
    echo ""
    echo "  6. Visit: https://${DOMAIN}"
    echo ""
    print_warning "Important: Save these credentials!"
    echo "  Database Password: ${DB_PASSWORD}"
    echo "  NextAuth Secret: ${NEXTAUTH_SECRET}"
    echo ""
    echo "  Credentials also saved in: ${PROJECT_DIR}/credentials.txt"
else
    echo "  4. Configure DNS and SSL if needed"
    echo ""
    echo "  5. Visit your domain"
fi
echo ""
print_info "Useful commands:"
echo "  View logs:     docker-compose logs -f app"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Backup:        ./scripts/backup.sh"
echo "  Deploy update: ./scripts/deploy.sh"
echo ""

if [ -n "$SUDO_USER" ]; then
    print_warning "Note: Log out and back in for Docker group membership to take effect"
    print_info "Or run: newgrp docker"
fi

echo ""
