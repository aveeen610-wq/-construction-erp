import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Building2, Users, UserPlus, ShieldCheck, Clock,
  FolderKanban, Calculator, Package, Images, Megaphone,
  LogOut, Menu, Moon, Sun, Globe
} from 'lucide-react';

const ROLE_LABELS = {
  owner: 'مالك', manager: 'مدير', accountant: 'محاسب', hr: 'موارد بشرية', inventory: 'مخزن', engineer: 'مهندس', employee: 'موظف'
};

const ROLE_DASHBOARD_TIPS = {
  owner: 'لوحة تحكم شاملة — جميع الصلاحيات',
  manager: 'لوحة تحكم — إدارة المشاريع والموظفين',
  accountant: 'لوحة المحاسبة — الحسابات والتقارير المالية',
  hr: 'لوحة الموارد البشرية — الحضور والموظفين',
  inventory: 'لوحة المخزون — إدارة المواد والمستودع',
  engineer: 'لوحة الهندسة — المشاريع والمتابعة',
  employee: 'لوحتك — الحضور والمشاريع المعينة'
};

export default function Layout() {
  const { user, logout, isOwner, isManager, canViewAccounting, canViewInventory } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role;
  const perms = user?.permissions || [];

  const hasPermission = (perm) => perms.includes('all') || perms.includes(perm);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },

    ...(isOwner || isManager ? [
      { to: '/employees', icon: Users, label: t('nav.employees'), show: true },
      { to: '/permissions', icon: ShieldCheck, label: 'الصلاحيات', show: isOwner },
    ] : []),

    { to: '/attendance', icon: Clock, label: t('nav.attendance'), show: true },

    { to: '/projects', icon: FolderKanban, label: t('nav.projects'), show: true },

    { to: '/accounting', icon: Calculator, label: t('nav.accounting'), show: canViewAccounting },

    { to: '/inventory', icon: Package, label: t('nav.inventory'), show: canViewInventory },

    { to: '/portfolio', icon: Images, label: t('nav.portfolio'), show: isOwner || isManager },
    { to: '/announcements', icon: Megaphone, label: t('nav.announcements'), show: true },
    { to: '/company-profile', icon: Building2, label: 'الملف التعريفي', show: isOwner || isManager },
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-blue-600 truncate">{user?.companyName || t('app.title')}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${
              role === 'owner' ? 'bg-purple-500' :
              role === 'manager' ? 'bg-blue-500' :
              role === 'accountant' ? 'bg-emerald-500' :
              role === 'hr' ? 'bg-amber-500' :
              role === 'inventory' ? 'bg-orange-500' :
              role === 'engineer' ? 'bg-cyan-500' : 'bg-gray-400'
            }`} />
            <p className="text-sm text-gray-500">{user?.fullName}</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[role] || role}</p>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button onClick={toggleLang} className="sidebar-link w-full">
            <Globe size={20} />
            <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="sidebar-link w-full">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? t('common.lightMode') : t('common.darkMode')}</span>
          </button>
          <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={20} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Menu size={24} />
          </button>
          <h2 className="font-bold text-blue-600">{user?.companyName || t('app.title')}</h2>
          <div />
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
