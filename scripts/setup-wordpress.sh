#!/bin/bash

# PubliCenter WordPress Setup Script
# يطلب معلومات WordPress من المستخدم

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if .env exists
ENV_FILE="/opt/publicenter/.env"
if [ ! -f "$ENV_FILE" ]; then
    print_error "ملف .env غير موجود!"
    print_info "يرجى تشغيل setup.sh أولاً"
    exit 1
fi

echo ""
print_info "========================================="
print_info "إعداد معلومات WordPress"
print_info "========================================="
echo ""

# Get current WordPress URL from .env
CURRENT_WP_URL=$(grep "^WORDPRESS_URL=" "$ENV_FILE" | cut -d'=' -f2)

if [ -n "$CURRENT_WP_URL" ] && [ "$CURRENT_WP_URL" != "" ]; then
    print_info "WordPress URL الحالي: $CURRENT_WP_URL"
    echo ""
    read -p "هل تريد استخدام نفس الرابط؟ (Y/n): " USE_CURRENT
    if [ "$USE_CURRENT" != "n" ] && [ "$USE_CURRENT" != "N" ]; then
        WORDPRESS_URL="$CURRENT_WP_URL"
    else
        read -p "أدخل رابط WordPress (مثال: https://tourismor.com): " WORDPRESS_URL
    fi
else
    read -p "أدخل رابط WordPress (مثال: https://tourismor.com): " WORDPRESS_URL
fi

echo ""

# Validate WordPress URL format
if [[ ! "$WORDPRESS_URL" =~ ^https?:// ]]; then
    print_error "الرابط يجب أن يبدأ بـ http:// أو https://"
    exit 1
fi

echo ""
print_info "========================================="
print_info "معلومات تسجيل الدخول"
print_info "========================================="
echo ""

# Request WordPress Username
while [ -z "$WORDPRESS_USERNAME" ]; do
    read -p "أدخل اسم المستخدم في WordPress: " WORDPRESS_USERNAME
    if [ -z "$WORDPRESS_USERNAME" ]; then
        print_error "اسم المستخدم مطلوب!"
    fi
done

echo ""

# Request Application Password
print_info "========================================="
print_info "Application Password"
print_info "========================================="
echo ""
print_warning "Application Password مختلف عن كلمة مرور تسجيل الدخول!"
echo ""
print_info "كيف تحصل على Application Password:"
echo "  1. سجّل الدخول إلى WordPress: $WORDPRESS_URL/wp-admin"
echo "  2. اذهب إلى: Users → Your Profile"
echo "  3. ابحث عن قسم 'Application Passwords'"
echo "  4. أدخل اسم (مثلاً: PubliCenter)"
echo "  5. اضغط 'Add New Application Password'"
echo "  6. انسخ كلمة المرور (ستظهر مرة واحدة فقط!)"
echo ""

while [ -z "$WORDPRESS_APP_PASSWORD" ]; do
    read -sp "أدخل Application Password: " WORDPRESS_APP_PASSWORD
    echo ""
    if [ -z "$WORDPRESS_APP_PASSWORD" ]; then
        print_error "Application Password مطلوب!"
    fi
done

echo ""

# Confirm
print_info "========================================="
print_info "تأكيد المعلومات"
print_info "========================================="
echo ""
echo "WordPress URL: $WORDPRESS_URL"
echo "Username: $WORDPRESS_USERNAME"
echo "Application Password: ${WORDPRESS_APP_PASSWORD:0:4}**** (مخفي)"
echo ""

read -p "هل المعلومات صحيحة؟ (Y/n): " CONFIRM
if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    print_warning "تم الإلغاء"
    exit 0
fi

echo ""

# Update .env file
print_info "جارٍ تحديث ملف .env..."

# Backup .env
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
print_success "تم إنشاء نسخة احتياطية من .env"

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

# Update Application Password
if grep -q "^WORDPRESS_APP_PASSWORD=" "$ENV_FILE"; then
    sed -i "s|^WORDPRESS_APP_PASSWORD=.*|WORDPRESS_APP_PASSWORD=$WORDPRESS_APP_PASSWORD|" "$ENV_FILE"
else
    echo "WORDPRESS_APP_PASSWORD=$WORDPRESS_APP_PASSWORD" >> "$ENV_FILE"
fi

# Secure .env file
chmod 600 "$ENV_FILE"

print_success "تم تحديث ملف .env بنجاح!"
echo ""

# Test WordPress connection (optional)
print_info "هل تريد اختبار الاتصال بـ WordPress؟ (Y/n): "
read -t 5 TEST_CONNECTION || TEST_CONNECTION="n"

if [ "$TEST_CONNECTION" != "n" ] && [ "$TEST_CONNECTION" != "N" ]; then
    echo ""
    print_info "جارٍ اختبار الاتصال..."
    
    # Test if WordPress is reachable
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORDPRESS_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        print_success "WordPress قابل للوصول (HTTP $HTTP_CODE)"
        
        # Test WordPress API
        API_URL="${WORDPRESS_URL}/wp-json/wp/v2/users"
        API_RESPONSE=$(curl -s -u "$WORDPRESS_USERNAME:$WORDPRESS_APP_PASSWORD" "$API_URL" || echo "")
        
        if echo "$API_RESPONSE" | grep -q "id"; then
            print_success "الاتصال بـ WordPress API نجح!"
        else
            print_warning "WordPress قابل للوصول لكن API قد يحتاج التحقق"
            print_info "تأكد من أن Application Password صحيح"
        fi
    else
        print_warning "WordPress غير قابل للوصول (HTTP $HTTP_CODE)"
        print_info "تأكد من أن الرابط صحيح وأن الموقع يعمل"
    fi
fi

echo ""
print_success "========================================="
print_success "تم إعداد WordPress بنجاح!"
print_success "========================================="
echo ""
print_info "الخطوات التالية:"
echo "  1. تأكد من أن جميع المعلومات في .env صحيحة"
echo "  2. رفع/نسخ كود التطبيق"
echo "  3. بناء وتشغيل Docker containers"
echo ""
print_info "لعرض ملف .env:"
echo "  cat /opt/publicenter/.env"
echo ""

