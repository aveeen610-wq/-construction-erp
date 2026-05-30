# AGENTS.md - Construction ERP Platform

## نظرة عامة
منصة ERP متعددة المستأجرين (Multi-Tenant) لإدارة شركات المقاولات.

**Live:** https://construction-erp-six.vercel.app
**Backend:** https://construction-erp-ib3u.onrender.com

## التقنيات المستخدمة
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + Axios + recharts + react-toastify + lucide-react + i18next
- **Backend**: Node.js + Express.js
- **Database**: nedb-promises (تخزين ملفي محلي، لا يحتاج MongoDB)
- **Auth**: JWT + bcryptjs
- **Language**: Arabic (RTL) + English (LTR) - دعم كامل للغتين
- **Deploy**: Vercel (Frontend) + Render (Backend)

## هيكل المشروع
```
construction-erp/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── render.yaml              # Render deploy config
│   ├── package.json
│   ├── data/                    # ملفات nedb (تتولد تلقائياً)
│   ├── uploads/                 # الملفات المرفوعة
│   ├── src/
│   │   ├── models/              # جميع الموديلات
│   │   ├── controllers/         # جميع Controllers
│   │   ├── routes/              # جميع Routes
│   │   ├── middleware/          # auth (JWT + RBAC), validate (Joi), upload (Multer)
│   │   └── utils/
│   │       ├── db.js            # nedb wrapper (يقلد Mongoose API)
│   │       └── seed.js          # بيانات تجريبية
├── frontend/
│   ├── index.html
│   ├── vercel.json              # Vercel deploy config + API proxy
│   ├── public/images/           # الصور الثابتة
│   ├── vite.config.js           # port 8080, proxy → localhost:5000
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Routes + AuthProvider
│       ├── index.css            # RTL + Custom classes
│       ├── i18n/                # ar.json + en.json
│       ├── contexts/            # AuthContext
│       ├── services/            # api.js (axios + all endpoints)
│       ├── components/          # Layout, SuperAdminLayout, ImageSlider
│       └── pages/               # جميع الصفحات
```

## Database (nedb-promises)
بديل لـ MongoDB للتطوير المحلي. كل "موديل" هو ملف `.db` في `backend/data/`.

### الموديلات الأساسية
- `Company` - الشركات المسجلة
- `PlatformAdmin` - مشرفي المنصة
- `PlatformAd` - إعلانات المنصة
- `User` - موظفو الشركة (roles: owner, manager, accountant, hr, inventory, engineer, employee)
- `Attendance` - سجل الحضور والغياب
- `Project` - المشاريع (ورشات، آليات، مهندسين، مصروفات، مواد)
- `PortfolioWork` - الأعمال المنفذة
- `Announcement` - الإعلانات (تدعم صور)
- `ContactMessage` - رسائل التواصل
- `InventoryItem` - أصناف المخزون
- `InventoryTransaction` - حركات المخزون

### موديلات المحاسبة (Job Costing)
- `CostCode` - أكواد التكلفة (CSI MasterFormat)
- `JobBudget` - ميزانية المشروع حسب كود التكلفة
- `JobCostEntry` - حركات التكاليف
- `ProgressBill` - الفوترة التدريجية مع Retainage
- `ChangeOrder` - أوامر التغيير

### موديلات المحاسبة الأساسية
- `Account` - دليل الحسابات
- `JournalEntry` - القيود اليومية

## API Endpoints

### Public
- `GET /api/public/companies` - قائمة الشركات النشطة
- `GET /api/public/companies/:id` - تفاصيل شركة
- `GET /api/public/companies/:id/announcements` - إعلانات شركة عامة
- `GET /api/public/announcements` - كل الإعلانات (عامة)
- `GET /api/public/works` - الأعمال المنفذة
- `GET /api/public/ads` - إعلانات المنصة
- `GET /api/public/stats` - إحصائيات المنصة
- `POST /api/public/contact` - إرسال رسالة تواصل
- `GET /api/public/messages` - قائمة الرسائل (سوبر أدمن)
- `PUT /api/public/messages/:id/read` - تحديد كمقروءة (سوبر أدمن)

### Auth
- `POST /api/auth/register` - إنشاء حساب + شركة
- `POST /api/auth/login` - تسجيل دخول
- `POST /api/auth/admin-login` - دخول مشرف
- `GET /api/auth/me` - بيانات المستخدم الحالي

### Company
- `GET /api/company/dashboard` - إحصائيات شاملة (حضور، مشاريع، مخزون، ميزانية)
- `GET /api/company/alerts` - إنذارات (مخزون منخفض، إجازات معلقة، تجاوز ميزانية)
- `GET /api/company/employees` - قائمة موظفين (بحث/فلترة/ترقيم)
- `POST /api/company/employees` - إضافة موظف (مع employeeId تلقائي)
- `PUT /api/company/employees/:id` - تعديل
- `DELETE /api/company/employees/:id` - حذف
- `PUT /api/company/permissions/:id` - تحديث صلاحيات
- `GET /api/company/profile` - بيانات الشركة
- `PUT /api/company/profile` - تحديث بيانات الشركة
- `POST /api/company/logo` - رفع شعار الشركة

### Attendance
- `POST /api/attendance/check-in` - تسجيل حضور
- `POST /api/attendance/check-out` - تسجيل خروج
- `GET /api/attendance/my-log` - سجل حضوري
- `GET /api/attendance/report` - تقرير الحضور (Owner/Manager/HR)
- `POST /api/attendance/leave-request` - طلب إجازة
- `PUT /api/attendance/leave-approve` - اعتماد إجازة

### Projects
- `GET /api/projects` - قائمة (search, filter, paginate)
- `GET /api/projects/:id` - تفاصيل
- `POST /api/projects` - إنشاء (6 خطوات)
- `PUT /api/projects/:id` - تعديل (تواريخ، ميزانية، حالة، وصف)
- `PUT /api/projects/:id/progress` - تحديث نسبة الإنجاز (100% = مكتمل تلقائياً)
- `POST /api/projects/:id/files` - رفع ملف
- `POST /api/projects/:id/expenses` - إضافة مصروف
- `POST /api/projects/:id/materials` - إضافة مادة من المخزون (خصم تلقائي)
- `GET /api/projects/:id/report` - تقرير شامل
- `GET /api/projects/:id/team` - فريق العمل

### Accounting
- `GET /api/accounts` - دليل الحسابات
- `POST /api/accounts` - إضافة حساب
- `GET /api/journal-entries` - القيود اليومية
- `POST /api/journal-entries` - إضافة قيد
- `GET /api/reports/balance-sheet` - الميزانية العمومية
- `GET /api/reports/income-statement` - قائمة الدخل

### Inventory
- `GET /api/inventory/items` - الأصناف
- `POST /api/inventory/items` - إضافة صنف
- `GET /api/inventory/transactions` - الحركات
- `POST /api/inventory/transactions` - إضافة حركة
- `GET /api/inventory/reports/low-stock` - تقرير المخزون المنخفض
- `GET /api/inventory/reports/ledger/:itemId` - دفتر الأستاذ

### Portfolio
- `GET /api/portfolio` - الأعمال المنفذة
- `POST /api/portfolio` - إضافة عمل (مع صور)

### Announcements
- `GET /api/announcements` - الإعلانات (محسوبة حسب الدور)
- `POST /api/announcements` - إنشاء إعلان (مع صور)

### Job Costing
- `GET /api/job-costing/cost-codes` - أكواد التكلفة
- `POST /api/job-costing/cost-codes` - إضافة كود
- `DELETE /api/job-costing/cost-codes/:id` - حذف كود
- `GET /api/job-costing/budget/:projectId` - ميزانية المشروع
- `PUT /api/job-costing/budget/:id` - تحديث ميزانية
- `POST /api/job-costing/entries` - تسجيل تكلفة
- `GET /api/job-costing/projects/:id/costs` - تكاليف المشروع
- `GET /api/job-costing/projects/:id/budget-vs-actual` - مقارنة ميزانية vs فعلي
- `POST /api/job-costing/billing/:projectId` - إنشاء فاتورة تدريجية
- `GET /api/job-costing/billing` - الفواتير
- `PUT /api/job-costing/billing/:id/approve` - اعتماد فاتورة
- `POST /api/job-costing/change-orders` - أمر تغيير
- `GET /api/job-costing/change-orders` - أوامر التغيير
- `PUT /api/job-costing/change-orders/:id/approve` - اعتماد أمر تغيير
- `GET /api/job-costing/wip-report` - تقرير WIP

## الصفحات (Frontend)

### الواجهة العامة
- `/` - Landing page (slider + إحصائيات + شركات + أعمال + إعلانات + تواصل)
- `/company/:id` - صفحة شركة عامة (معلومات + إعلانات + مشاريع منفذة مع سلايدر)
- `/login` - تسجيل دخول
- `/register` - إنشاء حساب + شركة

### لوحة المشرف العام
- `/admin` - إدارة الشركات (موافقة/تعليق) + الرسائل

### لوحة التحكم (حسب الدور)
- `/dashboard` - داش بورد مخصص حسب الصلاحيات:
  - **Owner/Manager**: إحصائيات شاملة + رسوم بيانية + إنذارات
  - **Accountant**: محاسبة + مشاريع + حضور
  - **HR**: موظفين + حضور + إجازات معلقة
  - **Inventory**: مخزون + مخزون منخفض + صرف مواد
  - **Engineer**: مشاريع نشطة + نسبة الإنجاز
  - **Employee**: حضور + مشاريع + إعلانات

### إدارة الموظفين
- `/employees` - قائمة (مع رقم وظيفيEMP-001) + طباعة تقرير
- `/employees/add` - إضافة موظف
- `/employees/:id/edit` - تعديل موظف
- `/permissions` - إدارة الصلاحيات (Owner يعدل، Manager يعرض)

### المشاريع
- `/projects` - قائمة مشاريع (بحث + فلترة)
- `/projects/:id` - تفاصيل مشروع:
  - نسبة الإنجاز (slider 0-100%)
  - تعديل المشروع (زر Edit)
  - فريق العمل
  - الورشات والآليات
  - المصروفات
  - المواد المستخدمة (صرف من المخزون مع سعر القطعة)
  - الملفات المرفوعة
- `/projects/:id/report` - تقرير شامل

### المحاسبة
- `/accounting` - دليل الحسابات + القيود اليومية + التقارير المالية

### المخزون
- `/inventory` - إدارة الأصناف + الحركات + تقرير المخزون المنخفض

### أخرى
- `/attendance` - حضور/غياب + تقويم + طلب إجازة
- `/portfolio` - الأعمال المنفذة (مع صور + سلايدر)
- `/announcements` - الإعلانات (مع صور)
- `/company-profile` - الملف التعريفي للشركة

## الصلاحيات حسب الدور

| الدور | الصلاحيات |
|-------|-----------|
| **owner** | كل الصلاحيات + تعديل الصلاحيات + حذف موظفين |
| **manager** | إدارة المشاريع + الموظفين + المحاسبة + المخزون |
| **accountant** | عرض + تعديل المحاسبة |
| **hr** | عرض + تعديل الموارد البشرية + الحضور |
| **inventory** | عرض + تعديل المخزون |
| **engineer** | عرض + تعديل المشاريع |
| **employee** | عرض المشاريع + الحضور |

## نظام الإنذارات (Dashboard)
- 🔴 **خطر**: تجاوز الميزانية
- 🟠 **تحذير**: مخزون منخفض، مشروع يقترب من الموعد النهائي
- 🔵 **معلومات**: طلبات إجازة معلقة

## نظام المخزون + المشاريع
- صرف مواد من المخزون للمشروع مع تحديد سعر القطعة
- خصم تلقائي من المخزون
- تسجيل المصروف تلقائياً ضد المشروع
- تتبع الكمية المتبقية

## نظام المحاسبة (Job Costing)
- **أكواد تكلفة CSI**: 15 كود جاهز (خرسانة، حديد، عمالة، معدات...)
- **ميزانية حسب المشروع**: Budget vs Actual vs Projected
- **فوترة تدريجية**: Progress Billing مع Retainage 5-10%
- **أوامر تغيير**: Change Orders مع اعتماد وتعديل الميزانية
- **تقرير WIP**: Work in Progress مع Over/Under Billing

## الدخول
| المستخدم | البريد | كلمة المرور |
|----------|--------|-------------|
| Super Admin | admin@platform.com | admin123 |
| مستخدم مسجّل | (يسجل بنفسه عبر /register) |

## تشغيل المشروع محلياً

```bash
# Backend (port 5000)
cd construction-erp/backend
npm install
npm run dev

# Frontend (port 8080)
cd construction-erp/frontend
npm install
npm run dev
```

## النشر

### Backend (Render)
1. ارفع مجلد `backend` على GitHub
2. Render → New Web Service
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Environment Variables: `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

### Frontend (Vercel)
1. ارفع مجلد `frontend` على GitHub
2. Vercel → New Project
3. Root Directory: `frontend`
4. Framework: Vite
5. Output Directory: `dist`

## ملاحظات تقنية
- nedb-promises تستخدم بدل MongoDB (ملفات محلية)
- البيانات تُحفظ في `backend/data/*.db`
- كل `companyId` يضمن عزل البيانات بين الشركات
- JWT middleware يتحقق من الصلاحيات في كل طلب
- مجلد `uploads/` ينشأ تلقائياً
- نسبة الإنجاز 100% = حالة المشروع تتغير تلقائياً لـ "مكتمل"
- كل موظف يحصل على employeeId تلقائي (EMP-001, EMP-002...)
- الداش بورد يتغير حسب دور المستخدم وصلاحياته
