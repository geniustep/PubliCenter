# 📋 المعلومات المطلوبة لملف .env

## 🔐 معلومات ملف .env

ملف `.env` يحتوي على جميع إعدادات التطبيق. فيما يلي شرح تفصيلي لكل متغير:

---

## ✅ المتغيرات المُولدة تلقائياً (جاهزة)

هذه المتغيرات تم توليدها تلقائياً ولا تحتاج تعديل:

```bash
# Database Configuration
DB_USER=publicenter              # ✅ جاهز (ثابت)
DB_PASSWORD=<generated>          # ✅ تم توليده تلقائياً
DB_NAME=publicenter               # ✅ جاهز (ثابت)

# Application Configuration
NEXTAUTH_SECRET=<generated>      # ✅ تم توليده تلقائياً
NODE_ENV=production               # ✅ جاهز (ثابت)

# Rate Limiting
API_RATE_LIMIT=100                # ✅ جاهز (افتراضي)

# Cache Settings
CACHE_TTL=300                     # ✅ جاهز (افتراضي)
```

---

## ⚠️ المتغيرات التي تحتاج إدخال (مطلوبة)

### 1. 🌐 معلومات النطاق (Domain)

```bash
DOMAIN=your-domain.com
APP_URL=https://your-domain.com
ADMIN_EMAIL=admin@your-domain.com
```

**مثال:**
```bash
DOMAIN=geniura.com
APP_URL=https://geniura.com
ADMIN_EMAIL=contact@geniura.com
```

**شرح:**
- `DOMAIN`: اسم النطاق بدون https://
- `APP_URL`: رابط التطبيق الكامل مع https://
- `ADMIN_EMAIL`: البريد الإلكتروني للمسؤول (يُستخدم لشهادات SSL)

**كيف تحصل عليها:**
- ✅ يجب أن يكون لديك نطاق (domain) مسجل
- ✅ يجب أن يشير النطاق إلى IP السيرفر (DNS A Record)
- ✅ البريد الإلكتروني: أي بريد صالح (لإشعارات SSL)

---

### 2. 📝 معلومات WordPress

```bash
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

**مثال:**
```bash
WORDPRESS_URL=https://mysite.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=abcd 1234 efgh 5678
```

**شرح:**
- `WORDPRESS_URL`: رابط موقع WordPress الكامل
- `WORDPRESS_USERNAME`: اسم المستخدم في WordPress
- `WORDPRESS_APP_PASSWORD`: كلمة مرور التطبيق (Application Password)

**كيف تحصل عليها:**

#### أ) إنشاء Application Password في WordPress:

1. سجّل الدخول إلى WordPress
2. اذهب إلى: **Users → Your Profile**
3. ابحث عن قسم **Application Passwords**
4. أدخل اسم للتطبيق (مثلاً: "PubliCenter")
5. اضغط **Add New Application Password**
6. **انسخ كلمة المرور** (ستظهر مرة واحدة فقط!)

**ملاحظة مهمة:**
- ⚠️ Application Password مختلف عن كلمة مرور تسجيل الدخول
- ⚠️ يجب إنشاؤه خصيصاً للتطبيق
- ⚠️ إذا فقدته، احذفه وأنشئ واحداً جديداً

---

### 3. 🌍 Google Translate API Key

```bash
GOOGLE_TRANSLATE_API_KEY=your-api-key-here
```

**مثال:**
```bash
GOOGLE_TRANSLATE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

**شرح:**
- مفتاح API من Google Cloud Platform
- يُستخدم لترجمة المحتوى تلقائياً

**كيف تحصل عليها:**

#### خطوات الحصول على Google Translate API Key:

1. **إنشاء حساب Google Cloud:**
   - اذهب إلى: https://console.cloud.google.com
   - سجّل الدخول بحساب Google

2. **إنشاء مشروع جديد:**
   - اضغط **New Project**
   - أدخل اسم المشروع (مثلاً: "PubliCenter")
   - اضغط **Create**

3. **تفعيل Cloud Translation API:**
   - اذهب إلى **APIs & Services → Library**
   - ابحث عن "Cloud Translation API"
   - اضغط **Enable**

4. **إنشاء API Key:**
   - اذهب إلى **APIs & Services → Credentials**
   - اضغط **Create Credentials → API Key**
   - **انسخ المفتاح** (سيظهر مرة واحدة)

5. **تقييد API Key (موصى به):**
   - اضغط على المفتاح المُنشأ
   - في **API restrictions**، اختر **Restrict key**
   - اختر **Cloud Translation API** فقط
   - اضغط **Save**

**التكلفة:**
- Google Translate API: **$20 لكل مليون حرف**
- هناك **500,000 حرف مجاني شهرياً**

---

## 📝 مثال كامل لملف .env

```bash
# Database Configuration
DB_USER=publicenter
DB_PASSWORD=YJyA93wdVtc04AgeERzWZFwAh6To7Of55qzZcUPkLSo=
DB_NAME=publicenter

# WordPress Configuration
WORDPRESS_URL=https://mysite.com
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=abcd 1234 efgh 5678

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz

# Application Configuration
APP_URL=https://publicenter.com
DOMAIN=publicenter.com
ADMIN_EMAIL=admin@publicenter.com
NEXTAUTH_SECRET=GFyOLD9S96HTFrQYkwd3KanIZxPGeDOPXFr2sA+jqb4=
NODE_ENV=production

# Rate Limiting
API_RATE_LIMIT=100

# Cache Settings
CACHE_TTL=300
```

---

## ✅ قائمة التحقق (Checklist)

قبل إكمال ملف .env، تأكد من:

- [ ] لديك نطاق (domain) مسجل
- [ ] النطاق يشير إلى IP السيرفر (DNS A Record)
- [ ] لديك موقع WordPress يعمل
- [ ] أنشأت Application Password في WordPress
- [ ] لديك حساب Google Cloud Platform
- [ ] فعّلت Cloud Translation API
- [ ] أنشأت API Key من Google
- [ ] نسخت جميع المعلومات بشكل صحيح

---

## 🔧 كيفية تعديل ملف .env

```bash
# فتح الملف للتعديل
nano /opt/publicenter/.env

# أو باستخدام vim
vim /opt/publicenter/.env

# بعد التعديل، احفظ الملف (Ctrl+X ثم Y ثم Enter في nano)
```

---

## ⚠️ تحذيرات مهمة

1. **لا تشارك ملف .env:**
   - ⚠️ يحتوي على معلومات حساسة
   - ⚠️ لا ترفعه إلى GitHub
   - ⚠️ صلاحيات الملف: 600 (قراءة/كتابة للمالك فقط)

2. **Application Password:**
   - ⚠️ يظهر مرة واحدة فقط عند الإنشاء
   - ⚠️ احفظه في مكان آمن
   - ⚠️ إذا فقدته، احذفه وأنشئ واحداً جديداً

3. **Google API Key:**
   - ⚠️ قيّد المفتاح على Cloud Translation API فقط
   - ⚠️ راقب الاستخدام لتجنب التكاليف غير المتوقعة
   - ⚠️ لا تشارك المفتاح

4. **Database Password:**
   - ✅ تم توليده تلقائياً (آمن)
   - ✅ محفوظ في `credentials.txt`
   - ⚠️ احفظه في مكان آمن

---

## 📞 المساعدة

إذا واجهت مشاكل:

1. **WordPress Application Password:**
   - راجع: https://wordpress.org/support/article/application-passwords/

2. **Google Translate API:**
   - راجع: https://cloud.google.com/translate/docs/setup

3. **DNS Configuration:**
   - تأكد من أن A Record يشير إلى IP السيرفر
   - استخدم: `dig your-domain.com` للتحقق

---

**ملاحظة:** بعد إكمال ملف .env، يمكنك المتابعة إلى بناء وتشغيل التطبيق!

