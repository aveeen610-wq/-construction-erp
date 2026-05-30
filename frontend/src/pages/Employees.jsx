import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { company } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Edit, Trash2, Search, ShieldCheck, Printer } from 'lucide-react';
import { toast } from 'react-toastify';

const roleLabels = {
  owner: 'مالك', manager: 'مدير', accountant: 'محاسب', hr: 'موارد بشرية', inventory: 'مخزن', engineer: 'مهندس', employee: 'موظف'
};

const roleColors = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  accountant: 'bg-emerald-100 text-emerald-700',
  hr: 'bg-amber-100 text-amber-700',
  inventory: 'bg-orange-100 text-orange-700',
  engineer: 'bg-cyan-100 text-cyan-700',
  employee: 'bg-gray-100 text-gray-700'
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { isOwner } = useAuth();
  const limit = 20;

  const fetchEmployees = async () => {
    try {
      const params = { page, limit, search, ...(roleFilter && { role: roleFilter }) };
      const res = await company.getEmployees(params);
      setEmployees(res.data.employees);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('فشل تحميل الموظفين');
    }
  };

  useEffect(() => { fetchEmployees(); }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      await company.deleteEmployee(id);
      toast.success('تم حذف الموظف');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الحذف');
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html dir="rtl">
      <head>
        <title>تقرير الموظفين</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e40af; margin-bottom: 5px; }
          h3 { text-align: center; color: #6b7280; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1e40af; color: white; padding: 10px; text-align: right; }
          td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
          tr:nth-child(even) { background: #f9fafb; }
          .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>تقرير الموظفين</h1>
        <h3>${employees[0]?.companyName || 'الشركة'} - ${new Date().toLocaleDateString('ar-SA')}</h3>
        <p style="text-align:center;color:#6b7280;">إجمالي الموظفين: ${total}</p>
        <table>
          <thead>
            <tr>
              <th>الرقم الوظيفي</th>
              <th>الاسم</th>
              <th>الدور</th>
              <th>البريد</th>
              <th>القسم</th>
              <th>المسمى الوظيفي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map(e => `
              <tr>
                <td><strong>${e.employeeId || '-'}</strong></td>
                <td>${e.fullName}</td>
                <td>${roleLabels[e.role] || e.role}</td>
                <td>${e.email}</td>
                <td>${e.department || '-'}</td>
                <td>${e.jobTitle || '-'}</td>
                <td>${e.status === 'active' ? 'نشط' : 'موقوف'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">تمت الطباعة في ${new Date().toLocaleString('ar-SA')}</div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">الموظفين ({total})</h1>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={18} />
            طباعة تقرير
          </button>
          <Link to="/employees/add" className="btn-primary flex items-center gap-2">
            <UserPlus size={20} />
            إضافة موظف
          </Link>
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="input-field pr-10" placeholder="بحث بالاسم أو البريد..." />
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-auto">
            <option value="">كل الأدوار</option>
            <option value="manager">مدير</option>
            <option value="accountant">محاسب</option>
            <option value="hr">موارد بشرية</option>
            <option value="inventory">مخزن</option>
            <option value="engineer">مهندس</option>
            <option value="employee">موظف</option>
          </select>
          <button type="submit" className="btn-primary">بحث</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-right p-3 text-sm font-semibold text-gray-600">الرقم الوظيفي</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">الاسم</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">الدور</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">البريد</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">القسم</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {emp.employeeId || '-'}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{emp.fullName}</td>
                  <td className="p-3">
                    <span className={`badge ${roleColors[emp.role] || 'bg-gray-100'}`}>
                      {roleLabels[emp.role] || emp.role}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{emp.email}</td>
                  <td className="p-3 text-sm text-gray-600">{emp.department || '-'}</td>
                  <td className="p-3">
                    <span className={emp.status === 'active' ? 'badge-success' : 'badge-danger'}>
                      {emp.status === 'active' ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/employees/${emp._id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit size={18} />
                      </Link>
                      {isOwner && emp.role !== 'owner' && (
                        <button onClick={() => handleDelete(emp._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      )}
                      {isOwner && emp.role !== 'owner' && (
                        <Link to={`/permissions?userId=${emp._id}`}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">
                          <ShieldCheck size={18} />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">إجمالي: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1">السابق</button>
              <span className="px-3 py-1 text-sm">{page} / {Math.ceil(total / limit)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
                className="btn-secondary text-sm px-3 py-1">التالي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
