# 📁 دليل الملفات للنشر - ماذا تنشر وماذا تستبعد

## 🚫 ملفات يجب استبعادها (لا تنشرها)

### 1. node_modules/
```bash
node_modules/
client/node_modules/
# السبب: حجم كبير جداً (100MB+) ويتم إعادة بناؤها تلقائياً
```

### 2. ملفات البيئة والبيانات الحساسة
```bash
.env                    # متغيرات البيئة السرية
database.sqlite*        # قاعدة البيانات المحلية
shared/sessions.sqlite  # جلسات المستخدمين
transcripts/           # سجلات المحادثات
# السبب: معلومات حساسة وبيانات محلية
```

### 3. ملفات الاختبار والتجربة
```bash
test*.js               # ملفات الاختبار
test*.png              # صور اختبار
test*.gif              # صور متحركة اختبار
# السبب: ملفات للتطوير فقط
```

### 4. ملفات التطوير والـ Cache
```bash
package-lock.json      # lock file (اختياري)
.git/                  # مستودع Git
.DS_Store              # ملفات macOS
.vscode/               # إعدادات VS Code
# السبب: ملفات التطوير فقط
```

### 5. ملفات البناء المؤقتة
```bash
client/dist/           # يتم بناؤها عند النشر
database.sqlite-wal    # SQLite WAL files
database.sqlite-shm    # SQLite SHM files
# السبب: ملفات مؤقتة تُعاد إنشاؤها
```

## ✅ ملفات يجب نشرها (مطلوبة للعمل)

### 1. الملفات الأساسية للمشروع
```
package.json              # الاعتماديات والسكربتات
railway.json             # إعدادات Railway
vercel.json              # إعدادات Vercel
deploy.sh                # سكربت النشر
DEPLOYMENT.md            # دليل النشر
.gitignore               # مستبعدات Git
```

### 2. ملفات البوت (bot/)
```
bot/
├── bot.js               # الملف الرئيسي للبوت
├── commands/            # جميع الأوامر Slash Commands
├── handlers/            # المعالجات (interactionHandler, commandLoader)
├── services/            # الخدمات (imageGenerator)
└── systems/             # الأنظمة (ticketSystem, azkarSystem)
```

### 3. ملفات السيرفر (server/)
```
server/
├── index.js             # الملف الرئيسي للسيرفر
├── routes/              # الـ API routes
│   ├── guildRoutes.js   # مسارات السيرفرات
│   └── ticketRoutes.js  # مسارات التذاكر
└── utils/               # الأدوات المساعدة
    └── discordUtils.js  # أدوات Discord
```

### 4. ملفات الواجهة الأمامية (client/)
```
client/
├── package.json         # اعتماديات الواجهة
├── vite.config.js       # إعدادات Vite
├── index.html           # الصفحة الرئيسية
└── src/                 # كود المصدر
    ├── components/      # المكونات
    ├── pages/           # الصفحات
    ├── hooks/           # Hooks مخصصة
    ├── services/        # الخدمات
    └── main.jsx         # نقطة الدخول
```

### 5. الملفات المشتركة (shared/)
```
shared/
├── database.js          # إعدادات قاعدة البيانات
└── firebase.js          # إعدادات Firebase
```

### 6. ملفات الـ Seed والنشر
```
seed_badges.js          # بيانات البدء للشارات
seed_shop_backgrounds.js # بيانات بدء المتجر
seed_shop_creative.js    # بيانات إبداعية للمتجر
seed_premium_assets.js   # أصول Premium
deploy-commands.js       # نشر الأوامر
clean_commands.js        # تنظيف الأوامر
```

## 🏗️ هيكل النشر على كل منصة

### 🚂 Railway.app (البوت + السيرفر)
```bash
# الملفات التي ترفع إلى GitHub وتربطها بـ Railway:
bot-dashboard/
├── package.json         # ضروري
├── railway.json         # إعدادات Railway
├── .gitignore          # مستبعدات Git
├── bot/
│   └── bot.js          # البوت الرئيسي
├── server/
│   └── index.js        # السيرفر الرئيسي
├── shared/
│   ├── database.js     # قاعدة البيانات
│   └── firebase.js     # Firebase
└── seed_*.js           # بيانات البدء
```

### 🌐 Vercel (الواجهة الأمامية فقط)
```bash
# الملفات التي ترفع إلى Vercel:
client/
├── package.json        # ضروري
├── vite.config.js      # إعدادات Vite
├── index.html          # الصفحة الرئيسية
├── vercel.json         # إعدادات Vercel
└── src/                # جميع ملفات المصدر
    ├── components/
    ├── pages/
    ├── hooks/
    ├── services/
    └── main.jsx
```

### 📦 VPS (نشر كامل)
```bash
# جميع الملفات المطلوبة على VPS:
bot-dashboard/
├── package.json        # ضروري
├── .env                # متغيرات البيئة (إنشاء يدوي)
├── bot/                # البوت
├── server/             # السيرفر
├── client/dist/        # الواجهة المبنية
├── shared/             # الملفات المشتركة
└── database.sqlite     # نسخة أولية من قاعدة البيانات
```

## 📋 قائمة التحقق قبل النشر

### ✅ قبل الرفع إلى GitHub:
- [ ] إضافة `.env.example` مع المتغيرات المطلوبة
- [ ] التأكد من `.gitignore` يحتوي على كل المستبعدات
- [ ] اختبار البوت والسيرفر محلياً
- [ ] بناء الواجهة الأمامية (`npm run build`)

### ✅ بعد النشر:
- [ ] إعداد متغيرات البيئة في Railway/Vercel
- [ ] رفع قاعدة البيانات الأولية (إذا لزم)
- [ ] اختبار الروابط والـ API endpoints
- [ ] التأكد من أن البوت متصل بالـ Discord

## 🔄 خطوات النشر السريع

1. **إعداد المستودع:**
   ```bash
   git init
   git add .
   git commit -m "Initial deployment setup"
   ```

2. **الرفع إلى GitHub:**
   ```bash
   git remote add origin https://github.com/username/bot-dashboard.git
   git push -u origin main
   ```

3. **ربط Railway:**
   - تسجيل الدخول إلى Railway
   - استيراد من GitHub
   - إعداد متغيرات البيئة

4. **نشر الواجهة:**
   ```bash
   cd client
   vercel --prod
   ```

---

**💡 ملاحظة:** دائماً احتفظ بنسخة احتياطية من قاعدة البيانات قبل النشر!
