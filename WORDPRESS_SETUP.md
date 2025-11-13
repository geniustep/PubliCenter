# دليل إضافة موقع WordPress للتطبيق

## الطريقة 1: استخدام API مباشرة

### المتطلبات:
1. **اسم الموقع** (name): اسم وصف للموقع
2. **رابط الموقع** (url): رابط WordPress الكامل (مثل: https://example.com)
3. **اللغة الأساسية** (language): AR, EN, FR, أو ES
4. **اسم المستخدم** (username): اسم المستخدم في WordPress
5. **كلمة مرور التطبيق** (appPassword): كلمة مرور التطبيق من WordPress (ليست كلمة المرور العادية)

### خطوات إضافة كلمة مرور التطبيق في WordPress:

1. سجل الدخول إلى لوحة تحكم WordPress
2. اذهب إلى: **المستخدمون** → **ملفك الشخصي** (Your Profile)
3. انتقل إلى قسم **كلمات مرور التطبيق** (Application Passwords)
4. أدخل اسم للتطبيق (مثل: "PubliCenter")
5. انقر على **إضافة كلمة مرور تطبيق جديدة** (Add New Application Password)
6. انسخ كلمة المرور التي تظهر (ستظهر مرة واحدة فقط!)

### إضافة الموقع عبر API:

```bash
curl -X POST https://publicenter.geniura.com/api/wordpress-sites \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "موقعي الرئيسي",
    "url": "https://example.com",
    "language": "AR",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx"
  }'
```

### مثال باستخدام JavaScript/TypeScript:

```typescript
const response = await fetch('/api/wordpress-sites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'موقعي الرئيسي',
    url: 'https://example.com',
    language: 'AR',
    username: 'admin',
    appPassword: 'xxxx xxxx xxxx xxxx xxxx xxxx'
  })
});

const data = await response.json();
if (data.success) {
  console.log('تم إضافة الموقع بنجاح!', data.data.site);
  console.log('البلوجن المكتشف:', data.data.pluginDetected);
} else {
  console.error('خطأ:', data.error);
}
```

## الطريقة 2: استخدام واجهة المستخدم (قريباً)

حالياً لا توجد صفحة واجهة مستخدم لإدارة مواقع WordPress، لكن يمكن إضافتها.

## ما يحدث عند إضافة الموقع:

1. ✅ **التحقق من البيانات**: يتم التحقق من صحة جميع البيانات المدخلة
2. ✅ **فحص التكرار**: يتم التحقق من عدم وجود موقع بنفس الرابط
3. ✅ **اختبار الاتصال**: يتم اختبار الاتصال بالموقع
4. ✅ **كشف البلوجن**: يتم كشف بلوجن الترجمة المستخدم تلقائياً (WPML, Polylang, TranslatePress, إلخ)
5. ✅ **حفظ البيانات**: يتم تشفير كلمة المرور وحفظ الموقع في قاعدة البيانات

## البلوجنات المدعومة:

- ✅ **WPML** - WPML Multilingual CMS
- ✅ **Polylang** - Polylang
- ✅ **TranslatePress** - TranslatePress
- ✅ **Weglot** - Weglot Translate
- ✅ **Loco Translate** - Loco Translate
- ✅ **qTranslate-XT** - qTranslate-XT

## API Endpoints المتاحة:

### 1. إضافة موقع جديد
```
POST /api/wordpress-sites
```

### 2. قائمة المواقع
```
GET /api/wordpress-sites?page=1&limit=10&isActive=true&language=AR
```

### 3. تفاصيل موقع محدد
```
GET /api/wordpress-sites/[id]
```

### 4. تحديث موقع
```
PUT /api/wordpress-sites/[id]
```

### 5. حذف موقع
```
DELETE /api/wordpress-sites/[id]
```

### 6. اختبار الاتصال
```
POST /api/wordpress-sites/[id]/test
```

### 7. كشف البلوجن
```
POST /api/wordpress-sites/[id]/detect-plugin
Body: { "appPassword": "xxxx xxxx xxxx xxxx xxxx xxxx" }
```

### 8. مزامنة المقالات
```
POST /api/wordpress-sites/[id]/sync
Body: { 
  "mode": "full" | "incremental",
  "languages": ["ar", "en"] // اختياري
}
```

## الصلاحيات المطلوبة:

- **ADMIN & EDITOR**: يمكنهم إضافة وتعديل وحذف المواقع
- **AUTHOR, CONTRIBUTOR, VIEWER**: يمكنهم فقط قراءة المواقع

## ملاحظات مهمة:

⚠️ **كلمة مرور التطبيق**: يجب استخدام كلمة مرور التطبيق وليس كلمة المرور العادية
⚠️ **التشفير**: يتم تشفير كلمة المرور قبل الحفظ في قاعدة البيانات
⚠️ **الكشف التلقائي**: يتم كشف بلوجن الترجمة تلقائياً عند الإضافة
⚠️ **الاختبار**: يتم اختبار الاتصال قبل الحفظ للتأكد من صحة البيانات

