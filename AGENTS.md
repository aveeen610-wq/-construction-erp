# AGENTS.md - Construction ERP Platform

## نظرة عامة
منصة ERP متعددة المستأجرين (Multi-Tenant) لإدارة شركات المقاولات.

## التقنيات المستخدمة
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + Axios + zustand + recharts + react-calendar + react-toastify + lucide-react + i18next
- **Backend**: Node.js + Express.js
- **Database**: nedb-promises (تخزين ملفي محلي، لا يحتاج MongoDB)
- **Auth**: JWT + bcryptjs
- **Language**: Arabic (RTL) + English (LTR) - دعم كامل للغتين

## هيكل المشروع
```
construction-erp/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   ├── data/                      # ملفات nedb (تتولد تلقائياً)
│   ├── uploads/                   # الملفات المرفوعة
│   ├── src/
│   │   ├── models/                # Company, User, Project, ContactMessage, إلخ
│   │   ├── controllers/           # auth, public, company, attendance, project, accounting, inventory, portfolio
│   │   ├── routes/                # auth, public, company, attendance, project, accounting, inventory, portfolio, announcement
│   │   ├── middleware/            # auth (JWT + RBAC), validate (Joi), upload (Multer)
│   │   └── utils/
│   │       ├── db.js              # nedb wrapper (يقلد Mongoose API)
│   │       └── seed.js            # بيانات تجريبية
├── frontend/
│   ├── index.html
│   ├── public/images/             # الصور الثابتة (خلفيات، صور المطور)
│   ├── vite.config.js            # port 8080, proxy → localhost:5000
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # Routes + AuthProvider
│       ├── index.css              # RTL + Custom classes
│       ├── i18n/                  # ar.json + en.json
│       ├── contexts/              # AuthContext (login, logout, permissions)
│       ├── services/              # api.js (axios + all endpoints)
│       ├── components/            # Layout (sidebar), SuperAdminLayout
│       └── pages/                 # Landing, Login, Dashboard, Employees, إلخ
```

## Database (nedb-promises)
بديل لـ MongoDB للتطوير المحلي. كل "موديل" هو ملف `.db` في `backend/data/`.

### الموديلات
- `Company` - الشركات المسجلة
- `PlatformAdmin` - مشرفي المنصة
- `PlatformAd` - إعلانات المنصة
- `User` - موظفو الشركة (roles: owner, manager, accountant, hr, inventory, engineer, employee)
- `Attendance` - سجل الحضور والغياب
- `Account` - دليل الحسابات
- `JournalEntry` - القيود اليومية
- `InventoryItem` - أصناف المخزون
- `InventoryTransaction` - حركات المخزون
- `Project` - المشاريع (ورشات، آليات، مهندسين مدنيين/معماريين، مصروفات)
- `PortfolioWork` - الأعمال المنفذة
- `Announcement` - الإعلانات الداخلية
- `ContactMessage` - رسائل التواصل من الواجهة الرئيسية

## API Endpoints

### Public
- `GET /api/public/companies` - قائمة الشركات النشطة
- `GET /api/public/companies/:id` - تفاصيل شركة + أعمالها المنفذة
- `GET /api/public/works` - الأعمال المنفذة
- `GET /api/public/ads` - إعلانات المنصة
- `GET /api/public/stats` - إحصائيات المنصة (عدد الشركات، المشاريع، الموظفين)
- `POST /api/public/contact` - إرسال رسالة تواصل (public)
- `GET /api/public/messages` - قائمة الرسائل (سوبر أدمن فقط)
- `PUT /api/public/messages/:id/read` - تحديد رسالة كمقروءة (سوبر أدمن)

### Auth
- `POST /api/auth/register` - إنشاء حساب + شركة (fullName, email, password, companyName)
- `POST /api/auth/login` - تسجيل دخول (email + password)
- `POST /api/auth/admin-login` - دخول مشرف (email + password)
- `GET /api/auth/me` - بيانات المستخدم الحالي

### Company (Owner/Manager)
- `GET /api/company/dashboard` - إحصائيات
- `GET /api/company/employees` - قائمة موظفين (بحث/فلترة/ترقيم)
- `POST /api/company/employees` - إضافة موظف
- `PUT /api/company/employees/:id` - تعديل
- `DELETE /api/company/employees/:id` - حذف
- `PUT /api/company/permissions/:id` - تحديث صلاحيات
- `GET /api/company/profile` - بيانات الشركة
- `PUT /api/company/profile` - تحديث بيانات الشركة (owner)
- `POST /api/company/logo` - رفع شعار الشركة (owner)
- `PUT /api/company/:id/status` - تغيير حالة (سوبر أدمن)
- `GET /api/company/all` - كل الشركات (سوبر أدمن)

### Attendance
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/my-log`
- `GET /api/attendance/report` (Owner/Manager/HR)
- `POST /api/attendance/leave-request`
- `PUT /api/attendance/leave-approve` (Owner/Manager/HR)

### Projects
- `GET /api/projects` - قائمة (search, filter, paginate)
- `GET /api/projects/:id` - تفاصيل (مع المهندسين والورشات والآليات)
- `POST /api/projects` - إنشاء (مع ورشات، آليات، مهندسين)
- `PUT /api/projects/:id` - تعديل
- `PUT /api/projects/:id/progress` - تحديث نسبة الإنجاز
- `POST /api/projects/:id/files` - رفع ملف
- `POST /api/projects/:id/expenses` - إضافة مصروف
- `GET /api/projects/:id/report` - تقرير كامل للمشروع
- `GET /api/projects/:id/team` - فريق العمل

### Accounting (Owner/Manager/Accountant)
- `GET /api/accounts` - دليل الحسابات
- `POST /api/accounts` - إضافة حساب
- `GET /api/journal-entries`
- `POST /api/journal-entries`
- `GET /api/reports/balance-sheet`
- `GET /api/reports/income-statement`

### Inventory (Owner/Manager/Inventory)
- `GET /api/inventory/items`
- `POST /api/inventory/items`
- `GET /api/inventory/transactions`
- `POST /api/inventory/transactions`
- `GET /api/inventory/reports/low-stock`
- `GET /api/inventory/reports/ledger/:itemId`

### Portfolio
- `GET /api/portfolio`
- `POST /api/portfolio`

### Announcements
- `GET /api/announcements`
- `POST /api/announcements`

## الصفحات (Frontend)

- `/` - Landing page (slider خلفية + إحصائيات حقيقية + أعمال منفذة + مطور المنصة)
- `/company/:id` - صفحة شركة عامة (تعرض أعمالها المنفذة)
- `/login` - تسجيل دخول (email + password)
- `/register` - إنشاء حساب + شركة
- `/admin` - لوحة المشرف العام (إدارة الشركات + الرسائل)
- `/dashboard` - لوحة التحكم
- `/company-profile` - الملف التعريفي للشركة (شعار + بيانات)
- `/employees` - قائمة الموظفين
- `/employees/add` - إضافة موظف
- `/employees/:id/edit` - تعديل موظف
- `/permissions` - مصفوفة الصلاحيات (Owner only)
- `/attendance` - حضور/غياب + تقويم + طلب إجازة
- `/projects` - قائمة مشاريع (إنشاء بـ 6 خطوات)
- `/projects/:id` - تفاصيل مشروع (فريق + ورشات + آليات + مصروفات)
- `/projects/:id/report` - تقرير شامل للمشروع
- `/accounting` - محاسبة
- `/inventory` - مخزون
- `/portfolio` - الأعمال المنفذة
- `/announcements` - الإعلانات

## تشغيل المشروع

```bash
# Backend (port 5000)
cd construction-erp/backend
npm run dev

# Frontend (port 8080)
cd construction-erp/frontend
npm run dev
```

### بيانات الدخول
| المستخدم | البريد | كلمة المرور |
|----------|--------|-------------|
| Super Admin | admin@platform.com | admin123 |
| مستخدم مسجّل | (يسجل بنفسه عبر /register) |

## تدفق التسجيل والدخول
1. **شركة تسجل** → `/register` ← الاسم، البريد، كلمة المرور، اسم الشركة
2. الشركة تنشأ بحالة **pending**، والمالك ينشأ بحالة active
3. **المشرف العام** (admin@platform.com) يفتح `/admin` ويشوف الشركات بانتظار الموافقة
4. المشرف يضغط **تفعيل** ← الشركة تصير active
5. **صاحب الشركة** يسجل دخول `/login` ويدخل Dashboard
6. صاحب الشركة يضيف موظفين من `/employees/add` بالأدوار
7. كل موظف يسجل دخول بـ (email + password)

## الميزات المضافة حديثاً

### المشاريع المحسّنة
- **إنشاء مشروع بـ 6 خطوات** مع شريط تقدم
- **المهندسين**: تفريق بين مدني ومعماري
- **الورشات**: إضافة ورشات (حدادة، نجارة، ألمنيوم...) مع التخصص والجوال
- **الآليات والمعدات**: إضافة معدات مع العدد وتكلفة التأجير
- **المصروفات**: تتبع مصروفات المشروع (مواد، عمالة، آليات، ورشات، نقل، تراخيص)
- **تقرير المشروع**: صفحة تقارير شاملة (ميزانية، مصروفات، مواد مستهلكة)

### الملف التعريفي للشركة
- رفع شعار الشركة
- تعديل اسم، وصف، سجل تجاري، رقم ضريبي
- تعديل معلومات الاتصال

### الواجهة الرئيسية
- **خلفية متحركة (Slider)** من صور المشروع
- **إحصائيات حقيقية** (عدد الشركات، المشاريع، الموظفين)
- **الأعمال المنفذة** بدل قائمة الشركات
- **قسم مطور المنصة** مع صورة وروابط تواصل
- **نموذج تواصل** يرسل رسائل للوحة تحكم الأدمن

### لوحة تحكم الأدمن
- تبويب الشركات (موافقة/تعليق)
- تبويب الرسائل (عرض رسائل الزوار وتحديد كمقروءة)

### تحسينات أخرى
- زر رفع ملفات موثوق (بدل react-dropzone)
- تسجيل خروج → يرجع للصفحة الرئيسية
- إنشاء مشروع ← يرجع للخطوة الأولى (بدون إغلاق)

## الملاحظات
- nedb-promises تستخدم بدل MongoDB/Mongoose
- البيانات تُحفظ في ملفات `backend/data/*.db`
- كل `companyId` يضمن عزل البيانات بين الشركات
- JWT middleware يتحقق من الصلاحيات في كل طلب
- مجلد `uploads/` ينشأ تلقائياً عند تشغيل السيرفر
