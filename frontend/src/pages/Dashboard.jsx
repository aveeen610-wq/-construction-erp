import { useState, useEffect } from 'react';
import { company, attendance } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, FolderKanban, Clock, Package, DollarSign, TrendingUp, AlertTriangle, UserX, CheckCircle, BarChart3, ClipboardList, Briefcase, Megaphone, Calculator } from 'lucide-react';

const ROLE_LABELS = {
  owner: 'مالك', manager: 'مدير', accountant: 'محاسب', hr: 'موارد بشرية', inventory: 'مخزن', engineer: 'مهندس', employee: 'موظف'
};

const ROLE_COLORS = {
  owner: 'from-purple-500 to-purple-700',
  manager: 'from-blue-500 to-blue-700',
  accountant: 'from-emerald-500 to-emerald-700',
  hr: 'from-amber-500 to-amber-700',
  inventory: 'from-orange-500 to-orange-700',
  engineer: 'from-cyan-500 to-cyan-700',
  employee: 'from-gray-500 to-gray-700'
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user, isOwner, isManager, canViewAccounting, canViewInventory } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    company.getDashboard()
      .then(res => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">{t('common.loading')}</div>;

  const { stats, weeklyStats, recentProjects, lowStockItems, pendingLeaves, absentToday } = data;
  const role = user?.role;

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${ROLE_COLORS[role] || 'from-gray-500 to-gray-700'} rounded-2xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">مرحباً بك</p>
            <h1 className="text-2xl font-bold">{user?.fullName}</h1>
            <p className="text-white/70 text-sm mt-1">{ROLE_LABELS[role]} — {user?.companyName}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
            {user?.fullName?.charAt(0)}
          </div>
        </div>
      </div>

      {(isOwner || isManager) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/employees" className="card-hover flex items-center gap-3 group">
              <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.employees}</p>
                <p className="text-xs text-gray-500">{t('dashboard.employees')}</p>
              </div>
            </Link>

            <Link to="/projects" className="card-hover flex items-center gap-3 group">
              <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                <FolderKanban size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.activeProjects}</p>
                <p className="text-xs text-gray-500">{isAr ? 'مشاريع نشطة' : 'Active Projects'}</p>
              </div>
            </Link>

            <Link to="/attendance" className="card-hover flex items-center gap-3 group">
              <div className="p-3 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.todayPresent}</p>
                <p className="text-xs text-gray-500">{t('dashboard.todayAttendance')}</p>
              </div>
            </Link>

            <Link to="/inventory" className="card-hover flex items-center gap-3 group">
              <div className="p-3 rounded-xl bg-red-100 group-hover:bg-red-200 transition-colors">
                <Package size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.lowStockCount}</p>
                <p className="text-xs text-gray-500">{t('dashboard.lowStock')}</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 text-sm">{isAr ? 'الميزانية الإجمالية' : 'Total Budget'}</h3>
                <DollarSign size={18} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{isAr ? 'مصروفات' : 'Spent'}: {stats.totalExpenses.toLocaleString()}</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalBudget > 0 ? Math.min((stats.totalExpenses / stats.totalBudget) * 100, 100) : 0}%` }} />
              </div>
            </div>

            <div className="card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 text-sm">{isAr ? 'المشاريع المكتملة' : 'Completed Projects'}</h3>
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedProjects}</p>
              <p className="text-xs text-gray-400 mt-1">{isAr ? 'من أصل' : 'Out of'} {stats.activeProjects + stats.completedProjects} {isAr ? 'مشروع' : 'projects'}</p>
            </div>

            <div className="card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 text-sm">{isAr ? 'طلبات الإجازة المعلقة' : 'Pending Leaves'}</h3>
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingLeaves}</p>
              <Link to="/attendance" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                {isAr ? 'عرض الكل' : 'View all'} →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-500" />
                {isAr ? 'الحضور خلال آخر 7 أيام' : 'Attendance Last 7 Days'}
              </h3>
              <div className="flex items-end gap-2 h-40">
                {weeklyStats.map((day, i) => {
                  const maxP = Math.max(...weeklyStats.map(d => d.present), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-0.5">
                        <div className="w-full bg-emerald-400 rounded-t transition-all"
                          style={{ height: `${(day.present / maxP) * 100}%`, minHeight: day.present > 0 ? '4px' : '0' }} />
                        <div className="w-full bg-red-300 rounded-b transition-all"
                          style={{ height: `${(day.absent / maxP) * 40}%`, minHeight: day.absent > 0 ? '4px' : '0' }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{day.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 rounded" /> {isAr ? 'حضور' : 'Present'}</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 rounded" /> {isAr ? 'غياب' : 'Absent'}</span>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FolderKanban size={18} className="text-emerald-500" />
                {isAr ? 'حالة المشاريع النشطة' : 'Active Projects Status'}
              </h3>
              <div className="space-y-3">
                {recentProjects.length > 0 ? recentProjects.map(p => (
                  <div key={p._id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{p.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                    </div>
                    <Link to={`/projects/${p._id}`} className="text-blue-500 hover:text-blue-700 shrink-0">
                      <TrendingUp size={16} />
                    </Link>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm text-center py-4">{isAr ? 'لا توجد مشاريع نشطة' : 'No active projects'}</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {role === 'accountant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/accounting" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-emerald-100 rounded-xl"><Calculator size={32} className="text-emerald-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">دليل الحسابات</h3>
              <p className="text-sm text-gray-500">إدارة الحسابات والقيود اليومية</p>
            </div>
          </Link>
          <Link to="/projects" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl"><FolderKanban size={32} className="text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">المشاريع</h3>
              <p className="text-sm text-gray-500">متابعة ميزانية وتكاليف المشاريع</p>
            </div>
          </Link>
          <Link to="/attendance" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-xl"><Clock size={32} className="text-amber-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">الحضور والغياب</h3>
              <p className="text-sm text-gray-500">تقرير الحضور والرواتب</p>
            </div>
          </Link>
          <div className="card-hover flex items-center gap-4">
            <div className="p-4 bg-purple-100 rounded-xl"><DollarSign size={32} className="text-purple-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">إجمالي المصروفات</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.totalExpenses.toLocaleString()} ريال</p>
            </div>
          </div>
        </div>
      )}

      {role === 'hr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/employees" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl"><Users size={32} className="text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">قائمة الموظفين</h3>
              <p className="text-sm text-gray-500">{stats.employees} موظف نشط</p>
            </div>
          </Link>
          <Link to="/attendance" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-xl"><Clock size={32} className="text-amber-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">الحضور اليوم</h3>
              <p className="text-sm text-gray-500">{stats.todayPresent} حاضر — {stats.todayAbsent} غائب</p>
            </div>
          </Link>
          {stats.pendingLeaves > 0 && (
            <Link to="/attendance" className="card-hover flex items-center gap-4 border-r-4 border-amber-400">
              <div className="p-4 bg-amber-100 rounded-xl"><AlertTriangle size={32} className="text-amber-600" /></div>
              <div>
                <h3 className="font-bold text-gray-800">إجازات معلقة</h3>
                <p className="text-sm text-amber-600">{stats.pendingLeaves} طلب بانتظار الموافقة</p>
              </div>
            </Link>
          )}
          {absentToday.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <UserX size={16} className="text-red-500" />
                الغائبين اليوم ({absentToday.length})
              </h3>
              <div className="space-y-2">
                {absentToday.map(u => (
                  <div key={u._id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                      {u.fullName?.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{u.fullName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {role === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/inventory" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-xl"><Package size={32} className="text-orange-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">إدارة المخزون</h3>
              <p className="text-sm text-gray-500">عرض وإضافة الأصناف</p>
            </div>
          </Link>
          {stats.lowStockCount > 0 && (
            <Link to="/inventory" className="card-hover flex items-center gap-4 border-r-4 border-red-400">
              <div className="p-4 bg-red-100 rounded-xl"><AlertTriangle size={32} className="text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-800">مخزون منخفض</h3>
                <p className="text-sm text-red-600">{stats.lowStockCount} صنف تحت الحد الأدنى</p>
              </div>
            </Link>
          )}
          <Link to="/projects" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl"><FolderKanban size={32} className="text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">صرف مواد للمشاريع</h3>
              <p className="text-sm text-gray-500">صرف من المخزون للمشاريع النشطة</p>
            </div>
          </Link>
          {lowStockItems.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-3 text-sm">أصناف منخفضة</h3>
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-xs text-amber-600 font-medium">{item.currentQty}/{item.minQty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {role === 'engineer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/projects" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl"><FolderKanban size={32} className="text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">المشاريع النشطة</h3>
              <p className="text-sm text-gray-500">{stats.activeProjects} مشروع نشط</p>
            </div>
          </Link>
          <Link to="/attendance" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-xl"><Clock size={32} className="text-amber-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">حضور اليوم</h3>
              <p className="text-sm text-gray-500">{stats.todayPresent} حاضر</p>
            </div>
          </Link>
          {recentProjects.length > 0 && (
            <div className="card md:col-span-2">
              <h3 className="font-bold text-gray-800 mb-3">المشاريع النشطة</h3>
              <div className="space-y-3">
                {recentProjects.map(p => (
                  <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{p.progress || 0}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {role === 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/attendance" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-xl"><Clock size={32} className="text-amber-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">سجل حضوري</h3>
              <p className="text-sm text-gray-500">تسجيل الحضور والخروج</p>
            </div>
          </Link>
          <Link to="/projects" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl"><FolderKanban size={32} className="text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">المشاريع</h3>
              <p className="text-sm text-gray-500">عرض المشاريع المعينة</p>
            </div>
          </Link>
          <Link to="/announcements" className="card-hover flex items-center gap-4">
            <div className="p-4 bg-purple-100 rounded-xl"><Megaphone size={32} className="text-purple-600" /></div>
            <div>
              <h3 className="font-bold text-gray-800">الإعلانات</h3>
              <p className="text-sm text-gray-500">عرض إعلانات الشركة</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
