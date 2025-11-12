#!/bin/bash

# PubliCenter Backup Script
# Run this daily via cron: 0 2 * * * /opt/publicenter/scripts/backup.sh

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

# Configuration
PROJECT_DIR="/opt/publicenter"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Start backup
log_message "========================================="
log_message "Starting PubliCenter Backup"
log_message "========================================="
log_message ""

# Change to project directory
cd $PROJECT_DIR || {
    log_message "ERROR: Failed to change to project directory: $PROJECT_DIR"
    exit 1
}

# ============================================
# Backup Database
# ============================================
log_message "Backing up database..."

if docker-compose ps postgres | grep -q "Up"; then
    # Dump database
    docker-compose exec -T postgres pg_dump -U publicenter publicenter > "${BACKUP_DIR}/db_${TIMESTAMP}.sql" 2>> $LOG_FILE

    if [ $? -eq 0 ]; then
        # Compress database dump
        gzip "${BACKUP_DIR}/db_${TIMESTAMP}.sql"

        # Get backup size
        BACKUP_SIZE=$(du -h "${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz" | cut -f1)

        log_message "✓ Database backup completed: db_${TIMESTAMP}.sql.gz (${BACKUP_SIZE})"
    else
        log_message "✗ Database backup failed"
        print_error "Database backup failed!"
    fi
else
    log_message "✗ PostgreSQL container not running, skipping database backup"
    print_error "PostgreSQL container not running!"
fi

log_message ""

# ============================================
# Backup Uploaded Media (if exists)
# ============================================
if [ -d "${PROJECT_DIR}/uploads" ] && [ "$(ls -A ${PROJECT_DIR}/uploads)" ]; then
    log_message "Backing up media files..."

    tar -czf "${BACKUP_DIR}/media_${TIMESTAMP}.tar.gz" -C ${PROJECT_DIR} uploads/ 2>> $LOG_FILE

    if [ $? -eq 0 ]; then
        MEDIA_SIZE=$(du -h "${BACKUP_DIR}/media_${TIMESTAMP}.tar.gz" | cut -f1)
        log_message "✓ Media backup completed: media_${TIMESTAMP}.tar.gz (${MEDIA_SIZE})"
    else
        log_message "✗ Media backup failed"
    fi
else
    log_message "ℹ No media files to backup"
fi

log_message ""

# ============================================
# Backup Public Uploads (if exists)
# ============================================
if [ -d "${PROJECT_DIR}/public/uploads" ] && [ "$(ls -A ${PROJECT_DIR}/public/uploads)" ]; then
    log_message "Backing up public uploads..."

    tar -czf "${BACKUP_DIR}/public_uploads_${TIMESTAMP}.tar.gz" -C ${PROJECT_DIR} public/uploads/ 2>> $LOG_FILE

    if [ $? -eq 0 ]; then
        PUBLIC_SIZE=$(du -h "${BACKUP_DIR}/public_uploads_${TIMESTAMP}.tar.gz" | cut -f1)
        log_message "✓ Public uploads backup completed: public_uploads_${TIMESTAMP}.tar.gz (${PUBLIC_SIZE})"
    else
        log_message "✗ Public uploads backup failed"
    fi
else
    log_message "ℹ No public uploads to backup"
fi

log_message ""

# ============================================
# Backup Environment Configuration
# ============================================
log_message "Backing up configuration..."

if [ -f "${PROJECT_DIR}/.env" ]; then
    cp ${PROJECT_DIR}/.env "${BACKUP_DIR}/env_${TIMESTAMP}.bak"

    if [ $? -eq 0 ]; then
        chmod 600 "${BACKUP_DIR}/env_${TIMESTAMP}.bak"
        log_message "✓ Configuration backup completed: env_${TIMESTAMP}.bak"
    else
        log_message "✗ Configuration backup failed"
    fi
else
    log_message "✗ .env file not found"
fi

log_message ""

# ============================================
# Backup Docker Compose Configuration
# ============================================
if [ -f "${PROJECT_DIR}/docker-compose.yml" ]; then
    cp ${PROJECT_DIR}/docker-compose.yml "${BACKUP_DIR}/docker-compose_${TIMESTAMP}.yml"
    log_message "✓ Docker Compose configuration backed up"
fi

log_message ""

# ============================================
# Calculate Total Backup Size
# ============================================
log_message "Calculating backup sizes..."

TOTAL_SIZE=$(du -sh ${BACKUP_DIR} | cut -f1)
log_message "Total backup directory size: ${TOTAL_SIZE}"

log_message ""

# ============================================
# Remove Old Backups
# ============================================
log_message "Cleaning old backups (keeping last ${RETENTION_DAYS} days)..."

# Count backups before cleanup
BEFORE_COUNT=$(find ${BACKUP_DIR} -name "db_*.sql.gz" | wc -l)

# Remove old database backups
find ${BACKUP_DIR} -name "db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE
find ${BACKUP_DIR} -name "media_*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE
find ${BACKUP_DIR} -name "public_uploads_*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE
find ${BACKUP_DIR} -name "env_*.bak" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE
find ${BACKUP_DIR} -name "docker-compose_*.yml" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE
find ${BACKUP_DIR} -name "backup_*.log" -mtime +${RETENTION_DAYS} -delete 2>> $LOG_FILE

# Count backups after cleanup
AFTER_COUNT=$(find ${BACKUP_DIR} -name "db_*.sql.gz" | wc -l)
REMOVED_COUNT=$((BEFORE_COUNT - AFTER_COUNT))

log_message "✓ Cleanup completed (removed ${REMOVED_COUNT} old backups, ${AFTER_COUNT} retained)"

log_message ""

# ============================================
# Verify Latest Backup
# ============================================
log_message "Verifying latest backup..."

LATEST_DB_BACKUP="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

if [ -f "$LATEST_DB_BACKUP" ]; then
    # Test if backup is valid gzip file
    if gzip -t "$LATEST_DB_BACKUP" 2>> $LOG_FILE; then
        log_message "✓ Database backup integrity verified"
    else
        log_message "✗ Database backup integrity check failed!"
        print_error "Backup integrity check failed!"
    fi
else
    log_message "✗ Latest database backup not found!"
fi

log_message ""

# ============================================
# Optional: Upload to Remote Storage
# ============================================
# Uncomment and configure one of the following options:

# Option 1: AWS S3
# if command -v aws &> /dev/null; then
#     log_message "Uploading backups to AWS S3..."
#     aws s3 sync ${BACKUP_DIR} s3://your-backup-bucket/publicenter/ \
#         --exclude "*" \
#         --include "db_${TIMESTAMP}.sql.gz" \
#         --include "media_${TIMESTAMP}.tar.gz" \
#         --include "env_${TIMESTAMP}.bak" \
#         2>> $LOG_FILE
#     if [ $? -eq 0 ]; then
#         log_message "✓ Backups uploaded to S3"
#     else
#         log_message "✗ S3 upload failed"
#     fi
# fi

# Option 2: rsync to Remote Server
# if command -v rsync &> /dev/null; then
#     log_message "Syncing backups to remote server..."
#     rsync -avz --delete \
#         ${BACKUP_DIR}/ \
#         user@backup-server:/backup/publicenter/ \
#         2>> $LOG_FILE
#     if [ $? -eq 0 ]; then
#         log_message "✓ Backups synced to remote server"
#     else
#         log_message "✗ Remote sync failed"
#     fi
# fi

# Option 3: Google Cloud Storage
# if command -v gsutil &> /dev/null; then
#     log_message "Uploading backups to Google Cloud Storage..."
#     gsutil -m rsync -r ${BACKUP_DIR} gs://your-backup-bucket/publicenter/ 2>> $LOG_FILE
#     if [ $? -eq 0 ]; then
#         log_message "✓ Backups uploaded to GCS"
#     else
#         log_message "✗ GCS upload failed"
#     fi
# fi

# ============================================
# Check Disk Space
# ============================================
log_message "Checking disk space..."

DISK_USAGE=$(df -h / | tail -n 1 | awk '{print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h / | tail -n 1 | awk '{print $4}')

log_message "Disk usage: ${DISK_USAGE}% (${DISK_AVAILABLE} available)"

if [ $DISK_USAGE -gt 90 ]; then
    log_message "⚠ WARNING: Disk usage is above 90%!"
    print_warning "Disk usage critical: ${DISK_USAGE}%"
elif [ $DISK_USAGE -gt 80 ]; then
    log_message "⚠ WARNING: Disk usage is above 80%"
fi

log_message ""

# ============================================
# Summary
# ============================================
log_message "========================================="
log_message "Backup Summary"
log_message "========================================="
log_message "Timestamp: ${TIMESTAMP}"
log_message "Backup Directory: ${BACKUP_DIR}"
log_message "Total Size: ${TOTAL_SIZE}"
log_message "Backups Retained: ${AFTER_COUNT}"
log_message "Log File: ${LOG_FILE}"
log_message "========================================="
log_message "Backup completed successfully"
log_message "========================================="
log_message ""

# Print success message to console
print_success "Backup completed successfully!"
print_info "Log file: ${LOG_FILE}"

# Exit successfully
exit 0
