# تحليل المشروع FONI — البنية التقنية وطريقة العمل

---

## 1. التقنيات المستخدمة في المشروع

### الواجهة الأمامية (Frontend)

| التقنية | الإصدار | الدور |
|--------|----------|------|
| **Next.js** | 16.1.6 | إطار العمل الرئيسي للواجهة: توجيه الصفحات (App Router)، عرض الخادم والتخزين المؤقت، وبناء التطبيق. |
| **React** | 19.2.3 | مكتبة واجهة المستخدم: مكونات، حالة، وتفاعل. |
| **TypeScript** | ^5 | لغة البرمجة: أنواع ثابتة وتقليل الأخطاء في الكود. |
| **Tailwind CSS** | ^4 | تنسيق الواجهة عبر classes جاهزة وتصميم متجاوب. |
| **Lucide React** | ^0.576.0 | أيقونات جاهزة في المكونات. |
| **React Icons** | ^5.6.0 | أيقونات إضافية عند الحاجة. |
| **slugify** | ^1.6.6 | تحويل النصوص إلى slugs للروابط. |

- **Next.js** يوفّر: مسارات ديناميكية مثل `[brand]` و `[id]`، مكونات خادم وعميل (`"use client"`)، وتحسين الصور عبر `next/image`.
- **Tailwind** يُطبَّق عبر `app/globals.css` و PostCSS؛ الخطوط من Google Fonts (Cairo للعربية، Poppins للإنجليزية).

### الخادم (Backend)

| التقنية | الإصدار | الدور |
|--------|----------|------|
| **Node.js** | (بيئة التشغيل) | تشغيل خادم الـ API. |
| **Express** | ^4.18.2 | إطار الـ API: مسارات، middleware، ومعالجة الطلبات. |
| **Mongoose** | ^8.0.3 (في server) | الاتصال بـ MongoDB، تعريف الـ Schemas والـ Models، والاستعلامات. |
| **dotenv** | ^16.3.1 | تحميل متغيرات البيئة من ملف `.env`. |
| **cors** | ^2.8.5 | السماح لطلبات من نطاق الواجهة (مثلاً localhost:3000) بالوصول إلى الـ API. |
| **jsonwebtoken** | ^9.0.2 | إصدار والتحقق من توكنات تسجيل دخول الأدمن. |
| **bcrypt** | ^5.1.1 | تشفير كلمات مرور الأدمن قبل الحفظ. |

- الـ **Backend** منفصل تماماً عن Next.js: مشروع مستقل داخل مجلد `server/` يعمل على منفذ (مثلاً 5000) ويقدّم REST API.

### قاعدة البيانات

| التقنية | الدور |
|--------|------|
| **MongoDB** | قاعدة بيانات NoSQL: تخزين الماركات، الهواتف، الإكسسوارات، أنواع الإكسسوارات، موديلات قطع الغيار، وحساب الأدمن. |
| **Mongoose** | طبقة ODM فوق MongoDB: Schemas، علاقات (ref/populate)، وتحقق من صحة البيانات. |

### ملخص الأدوار

- **Next.js**: عرض الصفحات، التوجيه، وطلب البيانات من الـ API عبر `fetch`.
- **Express**: استقبال الطلبات، التحقق من التوكن (للأدمن)، والردّ بـ JSON.
- **MongoDB + Mongoose**: تخزين وجلب البيانات وتنظيمها في Collections.
- **Tailwind + Lucide**: واجهة مستخدم موحّدة وأيقونات.

---

## 2. هيكل المشروع (Project Structure)

```
foni/
├── app/                    # Next.js App Router — الصفحات والـ layouts
│   ├── layout.tsx         # التخطيط الجذري (خطوط، لغة، RTL)
│   ├── page.tsx           # الصفحة الرئيسية
│   ├── globals.css        # أنماط Tailwind والعامة
│   ├── admin/             # لوحة التحكم
│   │   ├── page.tsx       # إعادة توجيه أو صفحة دخول
│   │   ├── login/         # تسجيل دخول الأدمن
│   │   └── (panel)/       # مجموعة route: لوحة التحكم بعد الدخول
│   │       ├── layout.tsx # القائمة الجانبية والأمان
│   │       ├── dashboard/
│   │       ├── spare-models/  # إدارة موديلات قطع الغيار
│   │       ├── phones/    # إضافة هواتف
│   │       ├── accessory-types/
│   │       └── accessories/
│   ├── phones/            # قسم الهواتف (عام)
│   │   ├── page.tsx       # قائمة الماركات
│   │   └── [brand]/       # هواتف ماركة معيّنة (ديناميكي)
│   ├── spare-parts/       # قسم قطع الغيار (عام)
│   │   ├── page.tsx       # ماركات قطع الغيار (من API)
│   │   └── [brandId]/     # موديلات هاتف لقطع الغيار
│   ├── accessories/       # قسم الإكسسوارات
│   │   ├── page.tsx
│   │   └── [type]/
│   ├── product/           # صفحة تفاصيل منتج (هاتف)
│   │   └── [id]/
│   └── accounts/
├── components/            # مكونات React قابلة لإعادة الاستخدام
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── CategorySlider.tsx
│   ├── BrandGrid.tsx         # ماركات ثابتة (صفحة الهواتف)
│   ├── SparePartsBrandGrid.tsx # ماركات من API (قطع الغيار)
│   ├── ProductGrid.tsx     # شبكة منتجات (هواتف من API)
│   └── ProductImage.tsx
├── lib/                   # دوال وتهيئة مشتركة (لا تحتوي API routes)
│   ├── adminAuth.ts       # عنوان الـ API، التوكن، getAuthHeaders
│   ├── brandLogos.ts      # روابط شعارات الماركات الرسمية
│   ├── productImage.ts    # مساعد لصور المنتجات
│   └── productsData.ts    # بيانات ثابتة احتياطية للمنتجات
├── public/                # ملفات ثابتة (صور، أيقونات)
├── server/                # مشروع Backend منفصل (Express + MongoDB)
│   ├── index.js           # نقطة الدخول، اتصال MongoDB، تسجيل المسارات
│   ├── .env                # متغيرات البيئة (غير مرفوع على Git)
│   ├── .env.example        # قالب المتغيرات المطلوبة
│   ├── middleware/
│   │   └── auth.js         # التحقق من JWT للأدمن
│   ├── models/             # نماذج Mongoose (جداول/Collections)
│   │   ├── Admin.js
│   │   ├── Brand.js
│   │   ├── Phone.js
│   │   ├── PhoneType.js    # موديل هاتف لقطع الغيار
│   │   ├── AccessoryType.js
│   │   └── Accessory.js
│   ├── controllers/        # منطق معالجة الطلبات (قائمة، إنشاء، تحديث، حذف)
│   │   ├── adminController.js
│   │   ├── brandController.js
│   │   ├── phoneController.js
│   │   ├── phoneTypeController.js
│   │   ├── accessoryTypeController.js
│   │   └── accessoryController.js
│   ├── routes/            # ربط المسارات بالـ controllers والـ middleware
│   │   ├── adminRoutes.js
│   │   ├── brandRoutes.js
│   │   ├── phoneTypeRoutes.js
│   │   ├── phoneRoutes.js
│   │   ├── accessoryTypeRoutes.js
│   │   └── accessoryRoutes.js
│   └── scripts/           # سكربتات مساعدة (تهيئة، إصلاح)
│       ├── seed.js        # إنشاء أدمن + ماركات أولية
│       └── fix-brand-slugs.js
├── package.json           # اعتماديات وتشغيل Next.js
├── next.config.ts         # إعدادات Next (مثلاً الصور عن بُعد)
└── .gitignore
```

### وظيفة المجلدات الرئيسية

| المجلد | الوظيفة |
|--------|----------|
| **app/** | كل صفحة = مسار. الملفات هنا تحدد الـ URL (مثلاً `app/phones/[brand]/page.tsx` → `/phones/samsung`). |
| **components/** | مكونات تُستورد في الصفحات؛ تفصل الواجهة إلى أجزاء قابلة لإعادة الاستخدام. |
| **lib/** | دوال ومتغيرات مشتركة (API URL، توكن الأدمن، شعارات الماركات). لا يوجد هنا مسارات API؛ الـ API كلها في السيرفر المنفصل. |
| **public/** | ملفات تُخدم كما هي (مثلاً `/LOGO.jpeg`). |
| **server/** | تطبيق Express كامل: اتصال DB، نماذج، مسارات API، ومصادقة. |

ملاحظة: في Next.js 16 لا تُستخدم مجلدات `pages/` أو `api/` في هذا المشروع؛ الواجهة كلها تحت `app/` والـ API كلها في `server/`.

---

## 3. كيفية عمل قاعدة البيانات

### أين يتم الاتصال بـ MongoDB؟

- **الملف**: `server/index.js`
- **الكود**:  
  `mongoose.connect(MONGODB_URI)`  
  حيث `MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foni"`.
- الاتصال يتم **مرة واحدة** عند تشغيل السيرفر؛ عند النجاح يُستدعى `app.listen(PORT)`، وعند الفشل يتم إيقاف العملية.

### كيف تُنشأ الـ Models؟

- كل Model في ملف مستقل داخل `server/models/`.
- يُعرَّف **Schema** بـ `mongoose.Schema` ثم يُصدَّر بـ `mongoose.model("Name", schema)`.
- الـ **Collection** في MongoDB تأخذ اسماً بصيغة الجمع الصغير (مثلاً `Brand` → collection `brands`).

### الـ Schemas والـ Collections

| الملف | Collection | الحقول الرئيسية |
|-------|------------|------------------|
| **Admin.js** | admins | email (فريد), password (مشفر بـ bcrypt في pre-save) |
| **Brand.js** | brands | name, slug, image — فهرس فريد على name |
| **Phone.js** | phones | name, brand (ref→Brand), phoneType (ref→PhoneType), image, price, stock, details, colors[] |
| **PhoneType.js** | phonetypes | name, image, brand (ref→Brand) — فهرس مركب فريد (brand + name) |
| **AccessoryType.js** | accessorytypes | name, image — فهرس فريد على name |
| **Accessory.js** | accessories | name, type (ref→AccessoryType), image, extraImages[], colors[], price, stock, details |

- **تخزين البيانات**: عبر دوال مثل `Model.create()` أو `doc.save()` في الـ controllers.
- **جلب البيانات**: عبر `Model.find()`, `findById()`, `findOne()` مع إمكانية `.populate("brand", "name slug")` لملء الحقول المرجعية قبل إرسال JSON للواجهة.

---

## 4. كيفية عمل الـ Backend

### كيف تعمل مسارات الـ API؟

1. في **server/index.js** يتم ربط كل مجموعة routes ببادئة:
   - `app.use("/api/brands", brandRoutes);`
   - `app.use("/api/phones", phoneRoutes);`
   - … إلخ.
2. داخل كل ملف في **routes/** يُنشأ `express.Router()` وتُعرَّف الطرق (GET, POST, PUT, DELETE) والـ handlers (من الـ controllers).
3. الطلب الذي يصل مثل `GET /api/phones?brand=xxx` يمر إلى `phoneRoutes` ثم إلى `list` في `phoneController`.

### أمثلة إنشاء Endpoint

- **قراءة عامة (بدون مصادقة)**:
  - `router.get("/", list);` → GET `/api/brands` يستدعي `brandController.list`.
- **كتابة (محمية بالأدمن)**:
  - `router.post("/", authMiddleware, create);` → POST `/api/brands` يمر أولاً من `authMiddleware` (التحقق من JWT)، ثم `brandController.create`.

### استقبال الطلبات من الواجهة

- الواجهة تستخدم `fetch(API_URL + "/api/...")` حيث `API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`.
- للطلبات المحمية: تُضاف الهيدر `Authorization: Bearer <token>` عبر `getAuthHeaders()` من `lib/adminAuth.ts` (التوكن يُحفظ في localStorage بعد تسجيل الدخول).

### إرسال البيانات من وإلى قاعدة البيانات

- **من الواجهة إلى الـ API**: `body: JSON.stringify({ name, brand, ... })` مع `Content-Type: application/json` (موجود في `getAuthHeaders()`).
- **في الـ Controller**: `req.body` للبيانات، `req.params` للـ id في المسار، `req.query` للاستعلام (مثل `?brand=xxx`).
- **من الـ API إلى DB**: `Model.create()`, `find()`, `findByIdAndUpdate()`, `findByIdAndDelete()`، مع `.populate()` عند الحاجة.
- **من الـ API إلى الواجهة**: `res.json(data)` أو `res.status(404).json({ error: "..." })`.

---

## 5. تدفق البيانات في المشروع

### النمط العام

```
المتصفح (User)
    ↓
Next.js (Frontend) — صفحة أو مكون عميل
    ↓ fetch(API_URL + "/api/...")
Express (Backend) — route → middleware (إن وُجد) → controller
    ↓
Mongoose → MongoDB (قراءة/كتابة)
    ↓
Controller يبني الاستجابة
    ↓ res.json(...)
Next.js يستقبل JSON ويحدّث الواجهة
    ↓
المتصفح (User)
```

### أمثلة ملموسة

**أ) عرض قائمة ماركات قطع الغيار (عام)**

1. المستخدم يفتح `/spare-parts`.
2. الصفحة `app/spare-parts/page.tsx` (عميل) في `useEffect` تستدعي `fetch(API_URL + "/api/brands")`.
3. Express: `GET /api/brands` → `brandRoutes.get("/", list)` → `brandController.list`.
4. الـ controller: `Brand.find().sort({ name: 1 }).lean()` → إرجاع مصفوفة JSON.
5. الصفحة تضع النتيجة في `brands` وتعرضها عبر `SparePartsBrandGrid`.

**ب) عرض هواتف ماركة معيّنة**

1. المستخدم يفتح `/phones/samsung`.
2. الصفحة `app/phones/[brand]/page.tsx` تعرض `ProductGrid` مع `selectedBrandId="samsung"`.
3. `ProductGrid` في `useEffect` تستدعي `fetch(API_URL + "/api/phones?brand=samsung")`.
4. Express: `GET /api/phones` → `phoneController.list` يقرأ `req.query.brand`، يجد أو ينشئ `Brand` من slug/name، ثم `Phone.find(filter).populate(...)`.
5. النتيجة تُعاد كـ JSON وتُعرض في البطاقات.

**ج) تسجيل دخول الأدمن ثم إنشاء هاتف**

1. المستخدم يدخل البريد وكلمة المرور في `/admin/login`.
2. الصفحة ترسل `POST /api/admin/login` مع `{ email, password }`.
3. `adminController.login` يتحقق من المستخدم ويقارن كلمة المرور (bcrypt)، ثم يُصدر JWT ويُرجع `{ token }`.
4. الواجهة تحفظ التوكن في localStorage وتوجّه إلى `/admin/dashboard`.
5. عند إضافة هاتف، النموذج يرسل `POST /api/phones` مع `Authorization: Bearer <token>` وبيانات الهاتف.
6. `authMiddleware` يتحقق من التوكن، ثم `phoneController.create` يحفظ الهاتف في MongoDB ويرجع السجل المُنشأ.

---

## 6. تقييم هيكل المشروع

### هل الهيكل احترافي؟

- **نعم بشكل عام**: فصل واضح بين Frontend (Next.js) و Backend (Express)، وضمن الـ Backend فصل بين routes و controllers و models و middleware. هذا نمط شائع وقابل للصيانة.

### هل مناسب لمتجر إلكتروني؟

- مناسب لمرحلة **MVP أو متجر صغير/متوسط**: إدارة ماركات، هواتف، إكسسوارات، قطع غيار، وأدمن واحد. لا يوجد حتى الآن نظام طلبات أو دفع أو مستخدمين عاديين؛ يمكن إضافتهم لاحقاً كمسارات وmodels إضافية.

### تحسينات مقترحة

1. **توحيد عنوان الـ API**: استخدام `lib/adminAuth.ts` (أو ملف مشترك واحد) لـ `API_URL` في كل المكونات بدل تكرار `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"` في عدة ملفات.
2. **طبقة خدمة (Service layer)**: نقل منطق الأعمال من الـ controllers إلى مجلد `services/` لتبسيط الـ controllers وتسهيل الاختبار وإعادة الاستخدام.
3. **معالجة أخطاء موحدة**: middleware في Express يلتقط الأخطاء ويرد بصيغة موحدة (مثلاً `{ error: message, code }`).
4. **تحقق من المدخلات (Validation)**: استخدام مكتبة مثل `joi` أو `zod` (أو express-validator) للتحقق من `req.body` و `req.params` بدل التحقق اليدوي في كل controller.
5. **بيئة التطوير للسيرفر**: إضافة `nodemon` أو `node --watch` في `server/package.json` لتشغيل السيرفر مع إعادة تشغيل تلقائي عند التعديل.
6. **صفحة الهواتف `/phones`**: حالياً `BrandGrid` يستخدم قائمة ماركات ثابتة (hardcoded) بينما قطع الغيار تأخذ الماركات من API؛ يمكن توحيد المصدر (إما كلها من API أو تعريف مشترك) ليكون الهيكل أوضح.

### تنظيم الملفات

- الهيكل الحالي منطقي. تحسين محتمل: تجميع ملفات لوحة التحكم تحت مجلدات مثل `app/admin/(panel)/*` مع إبقاء التوجيه والـ layout واضحين (وهذا موجود بالفعل). لا حاجة لتغيير جذري؛ التحسينات أعلاه تعزز الاحترافية دون إعادة هيكلة كاملة.

---

## 7. الأداء والتنظيم

### قابلية التوسع (Scalability)

- **أفقياً**: يمكن تشغيل أكثر من نسخة من خادم Express خلف موزع حمل (Load Balancer)، مع اشتراك نفس MongoDB. لا يوجد حالة (Session) مخزنة على السيرفر؛ الاعتماد على JWT فقط.
- **عمودياً**: إضافة فهارس على الحقول المستخدمة في الاستعلامات (مثل brand، phoneType) يسرّع الجلب؛ بعض الـ models لديها بالفعل indexes.
- **قاعدة البيانات**: عند نمو البيانات يمكن إضافة فهارس مركبة أو أرشفة؛ بنية الـ Schemas لا تعيق ذلك.

### تنظيم الكود

- **إيجابيات**: فصل routes/controllers/models، استخدام مكونات في الواجهة، وملف مشترك للمصادقة والـ API URL.
- **تحسينات**: تقليل تكرار تعريف `API_URL`، واستخراج منطق الأعمال إلى طبقة خدمات كما ذكر أعلاه.

### سرعة تحميل الموقع

- **Next.js**: يسمح بـ Server Components (مثل صفحة الماركة التي تعرض `ProductGrid`) وClient Components حيث الحاجة (مثل الجلب الديناميكي في `ProductGrid`). الصور يمكن تحسينها عبر `next/image` (موجود في المشروع مع إعدادات للنطاقات البعيدة).
- **الواجهة**: استخدام `fetch` من العميل يعني أن أول رسم للصفحة لا ينتظر الـ API؛ يمكن لاحقاً إضافة جلب بيانات في الخادم (Server-side) للصفحات الرئيسية لتحسين أول محتوى مرئي (First Contentful Paint) وـ SEO إن رغبت.
- **الـ API**: استجابة JSON خفيفة؛ التأخير يعتمد على استعلامات MongoDB والحجم. استخدام `.lean()` في الاستعلامات يقلل استهلاك الذاكرة وهو مناسب للقراءة.

### ملاءمة الهيكل للنشر على السيرفر

- **مناسب للنشر**: المشروع يتكون من تطبيقين:
  - **Frontend**: `npm run build` ثم `npm run start` (أو استضافة على Vercel/Netlify وغيرها).
  - **Backend**: تشغيل `node server/index.js` (أو عبر process manager مثل PM2) مع تعيين `PORT` و `MONGODB_URI` و `JWT_SECRET` في البيئة.
- **مهم للإنتاج**: استخدام قاعدة بيانات بعيدة (مثل MongoDB Atlas)، وعدم الاعتماد على localhost في الإنتاج، وتفعيل HTTPS، وتأمين `JWT_SECRET` وبيانات الأدمن.

---

## ملخص سريع

| الجانب | الحالة |
|--------|--------|
| التقنيات | Next.js + React + TypeScript + Tailwind في الواجهة؛ Express + Mongoose في الخادم؛ MongoDB قاعدة البيانات. |
| الهيكل | فصل واضح: app للصفحات، components للمكونات، lib للمساعدات، server للـ API والـ DB. |
| قاعدة البيانات | اتصال واحد في `server/index.js`؛ Models في `server/models/`؛ تخزين وجلب عبر Mongoose. |
| الـ API | مسارات REST في `server/routes/` مرتبطة بـ controllers وـ middleware مصادقة. |
| تدفق البيانات | متصفح → Next.js (fetch) → Express → Mongoose → MongoDB، ثم JSON راجع إلى الواجهة. |
| التقييم | هيكل احترافي ومناسب لمتجر إلكتروني صغير/متوسط؛ التحسينات المقترحة تزيد الاتساق والقابلية للصيانة والتوسع. |
| الأداء والنشر | قابل للتوسع مع تحسينات بسيطة؛ الكود منظم؛ النشر ممكن بتشغيل Frontend و Backend مع ضبط البيئة. |
