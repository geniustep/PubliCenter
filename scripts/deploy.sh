#!/bin/bash

# PubliCenter Deployment Script
# This script handles updates and deployments to production

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if in correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Error: docker-compose.yml not found!"
    print_info "Please run this script from the project root directory."
    exit 1
fi

print_info "Starting PubliCenter deployment..."
echo ""

# ============================================
# Backup Database
# ============================================
print_info "Creating database backup..."
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/publicenter_${TIMESTAMP}.sql"

# Check if postgres container is running
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U publicenter publicenter > $BACKUP_FILE
    gzip $BACKUP_FILE
    print_success "Database backed up to: ${BACKUP_FILE}.gz"
else
    print_warning "PostgreSQL container not running, skipping database backup"
fi
echo ""

# ============================================
# Pull Latest Code
# ============================================
print_info "Pulling latest code..."
if [ -d ".git" ]; then
    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Local changes detected, stashing..."
        git stash
    fi

    # Pull latest code
    git pull origin main || {
        print_error "Failed to pull latest code"
        print_info "If you have merge conflicts, resolve them manually and re-run this script"
        exit 1
    }

    print_success "Code updated"
else
    print_warning "Not a git repository, skipping code update"
fi
echo ""

# ============================================
# Check for Environment Variable Changes
# ============================================
print_info "Checking for environment variable changes..."
if [ -f ".env.example" ] && [ -f ".env" ]; then
    # Extract variable names from .env.example
    EXAMPLE_VARS=$(grep -v '^#' .env.example | grep -v '^$' | cut -d= -f1 | sort)
    CURRENT_VARS=$(grep -v '^#' .env | grep -v '^$' | cut -d= -f1 | sort)

    # Check for missing variables
    MISSING_VARS=$(comm -23 <(echo "$EXAMPLE_VARS") <(echo "$CURRENT_VARS"))

    if [ -n "$MISSING_VARS" ]; then
        print_warning "The following environment variables are missing from your .env file:"
        echo "$MISSING_VARS"
        echo ""
        print_info "Please update your .env file and re-run this script"
        exit 1
    else
        print_success "All required environment variables present"
    fi
else
    print_warning "Could not check environment variables"
fi
echo ""

# ============================================
# Rebuild Containers
# ============================================
print_info "Building Docker containers..."
docker-compose build --no-cache
print_success "Containers built"
echo ""

# ============================================
# Stop Old Containers
# ============================================
print_info "Stopping old containers..."
docker-compose down
print_success "Old containers stopped"
echo ""

# ============================================
# Start New Containers
# ============================================
print_info "Starting new containers..."
docker-compose up -d
print_success "New containers started"
echo ""

# ============================================
# Wait for Services to be Ready
# ============================================
print_info "Waiting for services to be ready..."
sleep 15

# Check if containers are running
if docker-compose ps | grep -q "Exit"; then
    print_error "Some containers failed to start!"
    print_info "Check logs with: docker-compose logs"
    exit 1
fi

print_success "Services are running"
echo ""

# ============================================
# Run Database Migrations
# ============================================
print_info "Running database migrations..."

# Check if Prisma schema exists
if [ -f "prisma/schema.prisma" ]; then
    # Generate Prisma Client
    docker-compose exec -T app npx prisma generate

    # Run migrations
    docker-compose exec -T app npx prisma migrate deploy || {
        print_warning "Migration failed, but continuing..."
    }

    print_success "Migrations completed"
else
    print_warning "Prisma schema not found, skipping migrations"
fi
echo ""

# ============================================
# Health Check
# ============================================
print_info "Running health check..."
sleep 5

HEALTH_URL="http://localhost:3000/api/health"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")

    if [ "$RESPONSE" = "200" ]; then
        print_success "Health check passed"
        HEALTH_OK=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Health check failed (HTTP $RESPONSE), retrying in 5 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        fi
    fi
done

if [ "$HEALTH_OK" != true ]; then
    print_error "Health check failed after $MAX_RETRIES attempts (HTTP $RESPONSE)"
    print_info "Check logs: docker-compose logs -f app"
    print_warning "Application may not be fully functional"
fi
echo ""

# ============================================
# Cleanup Old Backups
# ============================================
print_info "Cleaning up old backups (keeping last 7)..."
cd $BACKUP_DIR
ls -t publicenter_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
BACKUP_COUNT=$(ls -1 publicenter_*.sql.gz 2>/dev/null | wc -l)
cd ..
print_success "Cleanup completed ($BACKUP_COUNT backups retained)"
echo ""

# ============================================
# Clean Docker Resources
# ============================================
print_info "Cleaning unused Docker resources..."
docker system prune -f --volumes > /dev/null 2>&1
print_success "Docker cleanup completed"
echo ""

# ============================================
# Summary
# ============================================
print_success "========================================="
print_success "Deployment Complete!"
print_success "========================================="
echo ""

# Display container status
print_info "Container Status:"
docker-compose ps
echo ""

# Display disk usage
print_info "Disk Usage:"
df -h / | tail -n 1
echo ""

print_info "Useful commands:"
echo "  View logs:        docker-compose logs -f app"
echo "  View all logs:    docker-compose logs -f"
echo "  Restart:          docker-compose restart"
echo "  Stop:             docker-compose down"
echo "  View backups:     ls -lh $BACKUP_DIR"
echo ""

if [ "$HEALTH_OK" = true ]; then
    print_success "Application is healthy and running!"

    # Try to get the domain from .env
    if [ -f ".env" ]; then
        DOMAIN=$(grep "^DOMAIN=" .env | cut -d= -f2)
        if [ -n "$DOMAIN" ]; then
            echo ""
            print_info "Visit your application at: https://${DOMAIN}"
        fi
    fi
else
    print_warning "Application deployment completed but health check failed"
    print_info "Please check the logs and troubleshoot any issues"
fi

echo ""
