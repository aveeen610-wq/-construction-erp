import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { company } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

const ROLES = [
  { value: 'manager', label: 'مدير' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'hr', label: 'موارد بشرية' },
  { value: 'inventory', label: 'مدير مخزن' },
  { value: 'engineer', label: 'مهندس' },
  { value: 'employee', label: 'موظف' }
];

const ALL_PERMISSIONS = [
  'can_view_accounting', 'can_edit_accounting',
  'can_view_inventory', 'can_edit_inventory',
  'can_view_hr', 'can_edit_hr',
  'can_view_projects', 'can_edit_projects',
  'can_view_attendance', 'can_mark_attendance'
];

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', fullNameAr: '', email: '', username: '', password: '',
    phone: '', role: 'employee', department: '', jobTitle: '', salary: 0,
    permissions: []
  });

  useEffect(() => {
    if (isEdit) {
      company.getEmployees({ limit: 1 })
        .then(res => {
          const emp = res.data.employees.find(e => e._id === id);
          if (emp) setForm({ ...emp, password: '' });
        })
        .catch(() => toast.error('فشل تحميل بيانات الموظف'));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await company.updateEmployee(id, form);
        toast.success('تم تحديث بيانات الموظف');
      } else {
        await company.addEmployee(form);
        toast.success('تم إضافة الموظف بنجاح');
      }
      navigate('/employees');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/employees')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
        <ArrowLeft size={20} />
        <span>العودة للموظفين</span>
      </button>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus size={24} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالإنجليزية</label>
              <input name="fullNameAr" value={form.fullNameAr} onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEdit ? 'كلمة المرور (اترك فارغاً إذا لا تريد التغيير)' : 'كلمة المرور *'}
              </label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field" required={!isEdit} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الراتب</label>
              <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_PERMISSIONS.map(perm => (
                <label key={perm} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
            <Save size={20} />
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>
      </div>
    </div>
  );
}
