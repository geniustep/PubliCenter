#!/bin/bash

# PubliCenter WordPress Setup Script (Simple Version)
# استخدام: ./setup-wordpress-simple.sh username app_password

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

ENV_FILE="/opt/publicenter/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "ملف .env غير موجود!"
    exit 1
fi

# Get parameters
if [ $# -eq 2 ]; then
    WORDPRESS_USERNAME="$1"
    WORDPRESS_APP_PASSWORD="$2"
elif [ $# -eq 3 ]; then
    WORDPRESS_URL="$1"
    WORDPRESS_USERNAME="$2"
    WORDPRESS_APP_PASSWORD="$3"
else
    print_error "الاستخدام:"
    echo "  $0 <username> <app_password>"
    echo "  أو"
    echo "  $0 <wordpress_url> <username> <app_password>"
    echo ""
    print_info "مثال:"
    echo "  $0 admin 'abcd 1234 efgh 5678'"
    echo "  $0 https://tourismor.com admin 'abcd 1234 efgh 5678'"
    exit 1
fi

# Get WordPress URL from .env if not provided
if [ -z "$WORDPRESS_URL" ]; then
    WORDPRESS_URL=$(grep "^WORDPRESS_URL=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -z "$WORDPRESS_URL" ]; then
        print_error "WordPress URL غير موجود في .env"
        print_info "استخدم: $0 <wordpress_url> <username> <app_password>"
        exit 1
    fi
fi

echo ""
print_info "========================================="
print_info "تحديث معلومات WordPress"
print_info "========================================="
echo ""
echo "WordPress URL: $WORDPRESS_URL"
echo "Username: $WORDPRESS_USERNAME"
echo "Application Password: ${WORDPRESS_APP_PASSWORD:0:4}****"
echo ""

# Backup .env
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
print_success "تم إنشاء نسخة احتياطية"

# Update WordPress URL
if grep -q "^WORDPRESS_URL=" "$ENV_FILE"; then
    sed -i "s|^WORDPRESS_URL=.*|WORDPRESS_URL=$WORDPRESS_URL|" "$ENV_FILE"
else
    echo "WORDPRESS_URL=$WORDPRESS_URL" >> "$ENV_FILE"
fi

# Update WordPress Username
if grep -q "^WORDPRESS_USERNAME=" "$ENV_FILE"; then
    sed -i "s|^WORDPRESS_USERNAME=.*|WORDPRESS_USERNAME=$WORDPRESS_USERNAME|" "$ENV_FILE"
else
    echo "WORDPRESS_USERNAME=$WORDPRESS_USERNAME" >> "$ENV_FILE"
fi

# Update Application Password (escape special characters)
ESCAPED_PASSWORD=$(printf '%s\n' "$WORDPRESS_APP_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
if grep -q "^WORDPRESS_APP_PASSWORD=" "$ENV_FILE"; then
    sed -i "s|^WORDPRESS_APP_PASSWORD=.*|WORDPRESS_APP_PASSWORD=$WORDPRESS_APP_PASSWORD|" "$ENV_FILE"
else
    echo "WORDPRESS_APP_PASSWORD=$WORDPRESS_APP_PASSWORD" >> "$ENV_FILE"
fi

# Secure .env file
chmod 600 "$ENV_FILE"

print_success "تم تحديث ملف .env بنجاح!"
echo ""

# Show updated values
print_info "القيم المحدثة:"
grep "^WORDPRESS" "$ENV_FILE" | sed 's/PASSWORD=.*/PASSWORD=****/' | sed 's/APP_PASSWORD=.*/APP_PASSWORD=****/'
echo ""

print_success "تم الإعداد بنجاح!"

