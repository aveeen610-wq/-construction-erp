import { useState, useEffect } from 'react';
import { company } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';

const ROLE_LABELS = {
  owner: 'مالك',
  manager: 'مدير',
  accountant: 'محاسب',
  hr: 'موارد بشرية',
  inventory: 'مدير مخزن',
  engineer: 'مهندس',
  employee: 'موظف'
};

const ALL_PERMISSIONS = [
  { key: 'can_view_accounting', label: 'عرض المحاسبة' },
  { key: 'can_edit_accounting', label: 'تعديل المحاسبة' },
  { key: 'can_view_inventory', label: 'عرض المخزون' },
  { key: 'can_edit_inventory', label: 'تعديل المخزون' },
  { key: 'can_view_hr', label: 'عرض الموارد البشرية' },
  { key: 'can_edit_hr', label: 'تعديل الموارد البشرية' },
  { key: 'can_view_projects', label: 'عرض المشاريع' },
  { key: 'can_edit_projects', label: 'تعديل المشاريع' },
  { key: 'can_view_attendance', label: 'عرض الحضور' },
  { key: 'can_mark_attendance', label: 'تسجيل حضور الآخرين' }
];

const ROLE_DEFAULT_PERMISSIONS = {
  manager: ['can_view_accounting', 'can_edit_accounting', 'can_view_inventory', 'can_edit_inventory', 'can_view_hr', 'can_edit_hr', 'can_view_projects', 'can_edit_projects', 'can_view_attendance', 'can_mark_attendance'],
  accountant: ['can_view_accounting', 'can_edit_accounting'],
  hr: ['can_view_hr', 'can_edit_hr', 'can_view_attendance', 'can_mark_attendance'],
  inventory: ['can_view_inventory', 'can_edit_inventory'],
  engineer: ['can_view_projects', 'can_edit_projects'],
  employee: ['can_view_projects', 'can_view_attendance']
};

export default function Permissions() {
  const [employees, setEmployees] = useState([]);
  const [permissionsMap, setPermissionsMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const { isOwner } = useAuth();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await company.getEmployees({ limit: 100 });
        const nonOwner = res.data.employees.filter(e => e.role !== 'owner');
        setEmployees(nonOwner);
        const map = {};
        nonOwner.forEach(e => { map[e._id] = e.permissions || []; });
        setPermissionsMap(map);
      } catch (err) {
        toast.error('فشل تحميل الموظفين');
      }
    };
    fetchEmployees();
  }, []);

  const togglePermission = (empId, perm) => {
    if (!isEditing) return;
    setPermissionsMap(prev => {
      const current = prev[empId] || [];
      return {
        ...prev,
        [empId]: current.includes(perm)
          ? current.filter(p => p !== perm)
          : [...current, perm]
      };
    });
  };

  const resetToDefault = (empId, role) => {
    if (!isEditing) return;
    const defaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
    setPermissionsMap(prev => ({ ...prev, [empId]: defaults }));
    toast.info('تمت إعادة الصلاحيات للوضع الافتراضي');
  };

  const savePermissions = async (empId) => {
    try {
      await company.updatePermissions(empId, { permissions: permissionsMap[empId] || [] });
      toast.success('تم حفظ الصلاحيات');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل حفظ الصلاحيات');
    }
  };

  const saveAll = async () => {
    try {
      await Promise.all(employees.map(emp =>
        company.updatePermissions(emp._id, { permissions: permissionsMap[emp._id] || [] })
      ));
      toast.success('تم حفظ جميع الصلاحيات');
      setIsEditing(false);
    } catch (err) {
      toast.error('فشل حفظ بعض الصلاحيات');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-800">إدارة الصلاحيات</h1>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-primary flex items-center gap-2">
                تعديل الصلاحيات
              </button>
            ) : (
              <>
                <button onClick={saveAll} className="btn-primary flex items-center gap-2">
                  <Save size={18} />
                  حفظ الكل
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  إلغاء
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800 text-sm">
          يمكنك عرض الصلاحيات فقط. للمالك فقط تعديل الصلاحيات.
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-right p-3 text-sm font-semibold text-gray-600 sticky right-0 bg-gray-50">الموظف</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">الدور</th>
                {ALL_PERMISSIONS.map(p => (
                  <th key={p.key} className="text-center p-3 text-xs font-semibold text-gray-600 min-w-[100px]">
                    {p.label}
                  </th>
                ))}
                {isOwner && (
                  <th className="text-center p-3 text-sm font-semibold text-gray-600">إجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium sticky right-0 bg-white">{emp.fullName}</td>
                  <td className="p-3">
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {ROLE_LABELS[emp.role] || emp.role}
                    </span>
                  </td>
                  {ALL_PERMISSIONS.map(p => (
                    <td key={p.key} className="text-center p-3">
                      <input type="checkbox"
                        checked={(permissionsMap[emp._id] || []).includes(p.key)}
                        onChange={() => togglePermission(emp._id, p.key)}
                        disabled={!isEditing}
                        className={`w-5 h-5 text-blue-600 rounded ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} />
                    </td>
                  ))}
                  {isOwner && (
                    <td className="text-center p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => resetToDefault(emp._id, emp.role)}
                          title="إعادة للوضع الافتراضي"
                          className="text-gray-400 hover:text-amber-600 p-1">
                          <RotateCcw size={16} />
                        </button>
                        <button onClick={() => savePermissions(emp._id)}
                          className="btn-primary text-sm px-3 py-1">
                          <Save size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
