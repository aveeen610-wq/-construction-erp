import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projects, company } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, FolderKanban, ExternalLink, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const statusColors = {
  planned: 'badge-info',
  active: 'badge-success',
  on_hold: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-danger'
};

const statusLabels = {
  planned: 'مخطط',
  active: 'نشط',
  on_hold: 'معلق',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

export default function Projects() {
  const [projectList, setProjectList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', clientName: '', clientPhone: '', location: '', budget: 0, startDate: '', endDate: '', assignedCivilEngineers: [], assignedArchEngineers: [], workshops: [], machinery: [] });
  const [workshopInput, setWorkshopInput] = useState({ name: '', specialization: '', phone: '', contactPerson: '' });
  const [machineryInput, setMachineryInput] = useState({ name: '', type: '', quantity: 1, rentalCost: 0, hoursWorked: 0 });
  const [step, setStep] = useState(1);
  const { isOwner, isManager } = useAuth();
  const canEdit = isOwner || isManager;

  useEffect(() => {
    company.getEmployees({ limit: 100 }).then(res => setEmployees(res.data.employees)).catch(() => {});
  }, []);

  const fetchProjects = async () => {
    try {
      const params = { page, limit: 10, search, ...(statusFilter && { status: statusFilter }) };
      const res = await projects.getAll(params);
      setProjectList(res.data.projects);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('فشل تحميل المشاريع');
    }
  };

  useEffect(() => { fetchProjects(); }, [page, statusFilter]);

  const resetForm = () => {
    setForm({ title: '', description: '', clientName: '', clientPhone: '', location: '', budget: 0, startDate: '', endDate: '', assignedCivilEngineers: [], assignedArchEngineers: [], workshops: [], machinery: [] });
    setStep(1);
    setWorkshopInput({ name: '', specialization: '', phone: '', contactPerson: '' });
    setMachineryInput({ name: '', type: '', quantity: 1, rentalCost: 0, hoursWorked: 0 });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await projects.create(form);
      toast.success('تم إنشاء المشروع');
      resetForm();
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إنشاء المشروع');
    }
  };

  const toggleCivilEng = (id) => {
    setForm(f => ({ ...f, assignedCivilEngineers: f.assignedCivilEngineers.includes(id) ? f.assignedCivilEngineers.filter(x => x !== id) : [...f.assignedCivilEngineers, id] }));
  };

  const toggleArchEng = (id) => {
    setForm(f => ({ ...f, assignedArchEngineers: f.assignedArchEngineers.includes(id) ? f.assignedArchEngineers.filter(x => x !== id) : [...f.assignedArchEngineers, id] }));
  };

  const addWorkshop = () => {
    if (!workshopInput.name) return;
    setForm(f => ({ ...f, workshops: [...f.workshops, workshopInput] }));
    setWorkshopInput({ name: '', specialization: '', phone: '', contactPerson: '' });
  };

  const removeWorkshop = (i) => {
    setForm(f => ({ ...f, workshops: f.workshops.filter((_, idx) => idx !== i) }));
  };

  const addMachinery = () => {
    if (!machineryInput.name) return;
    setForm(f => ({ ...f, machinery: [...f.machinery, machineryInput] }));
    setMachineryInput({ name: '', type: '', quantity: 1, rentalCost: 0, hoursWorked: 0 });
  };

  const removeMachinery = (i) => {
    setForm(f => ({ ...f, machinery: f.machinery.filter((_, idx) => idx !== i) }));
  };

  const civilEngineers = employees.filter(e => e.role === 'engineer' || e.role === 'employee');
  const archEngineers = employees.filter(e => e.role === 'engineer' || e.role === 'employee');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">المشاريع</h1>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            إضافة مشروع
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pr-10" placeholder="بحث..." />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-auto">
            <option value="">كل الحالات</option>
            <option value="planned">مخطط</option>
            <option value="active">نشط</option>
            <option value="on_hold">معلق</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <button onClick={fetchProjects} className="btn-primary">بحث</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectList.map(project => (
          <Link key={project._id} to={`/projects/${project._id}`} className="card-hover group">
            <div className="flex items-start justify-between mb-3">
              <FolderKanban size={24} className="text-blue-600" />
              <span className={statusColors[project.status]}>{statusLabels[project.status]}</span>
            </div>
            <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
              {project.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>العميل: {project.clientName || '-'}</span>
              <span>الميزانية: {project.budget?.toLocaleString()} ريال</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>نسبة الإنجاز</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">مشروع جديد</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-1 mb-6">
              {[1,2,3,4,5,6].map(s => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s < step ? 'bg-emerald-500 text-white' :
                    s === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s < step ? <Check size={16} /> : s}
                  </div>
                  {s < 6 && <div className={`flex-1 h-1 ${s < step ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreate(e); }}>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-600">المعلومات الأساسية</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المشروع *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field" rows="2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                      <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">جوال العميل</label>
                      <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                        className="input-field" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-600">الموقع والميزانية</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية</label>
                    <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                      className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
                      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية</label>
                      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="input-field" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-600">المهندسون</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">مهندسين مدنيين</label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                        {civilEngineers.map(emp => (
                          <label key={emp._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-50 p-1 rounded">
                            <input type="checkbox" checked={form.assignedCivilEngineers.includes(emp._id)}
                              onChange={() => toggleCivilEng(emp._id)} />
                            {emp.fullName} - {emp.jobTitle || emp.role}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">مهندسين معماريين</label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                        {archEngineers.map(emp => (
                          <label key={emp._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-50 p-1 rounded">
                            <input type="checkbox" checked={form.assignedArchEngineers.includes(emp._id)}
                              onChange={() => toggleArchEng(emp._id)} />
                            {emp.fullName} - {emp.jobTitle || emp.role}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-600">الورشات</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.workshops.map((w, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {w.name}
                        <button type="button" onClick={() => removeWorkshop(i)}><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input value={workshopInput.name} onChange={(e) => setWorkshopInput({ ...workshopInput, name: e.target.value })}
                      placeholder="اسم الورشة" className="input-field text-sm" />
                    <input value={workshopInput.specialization} onChange={(e) => setWorkshopInput({ ...workshopInput, specialization: e.target.value })}
                      placeholder="التخصص" className="input-field text-sm" />
                    <input value={workshopInput.phone} onChange={(e) => setWorkshopInput({ ...workshopInput, phone: e.target.value })}
                      placeholder="الجوال" className="input-field text-sm" />
                    <button type="button" onClick={addWorkshop} className="btn-primary text-sm">إضافة</button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-blue-600">الآليات والمعدات</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.machinery.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm">
                        {m.name} x{m.quantity}
                        <button type="button" onClick={() => removeMachinery(i)}><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <input value={machineryInput.name} onChange={(e) => setMachineryInput({ ...machineryInput, name: e.target.value })}
                      placeholder="اسم المعدة" className="input-field text-sm" />
                    <input value={machineryInput.type} onChange={(e) => setMachineryInput({ ...machineryInput, type: e.target.value })}
                      placeholder="النوع" className="input-field text-sm" />
                    <input type="number" value={machineryInput.quantity} onChange={(e) => setMachineryInput({ ...machineryInput, quantity: Number(e.target.value) })}
                      placeholder="العدد" className="input-field text-sm" />
                    <input type="number" value={machineryInput.rentalCost} onChange={(e) => setMachineryInput({ ...machineryInput, rentalCost: Number(e.target.value) })}
                      placeholder="تكلفة التأجير" className="input-field text-sm" />
                    <button type="button" onClick={addMachinery} className="btn-primary text-sm">إضافة</button>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-emerald-600">مراجعة البيانات</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <p><span className="font-medium">عنوان المشروع:</span> {form.title}</p>
                    <p><span className="font-medium">الوصف:</span> {form.description || '-'}</p>
                    <p><span className="font-medium">العميل:</span> {form.clientName || '-'} {form.clientPhone && `(${form.clientPhone})`}</p>
                    <p><span className="font-medium">الموقع:</span> {form.location || '-'}</p>
                    <p><span className="font-medium">الميزانية:</span> {form.budget.toLocaleString()} ريال</p>
                    <p><span className="font-medium">تاريخ البداية:</span> {form.startDate || '-'}</p>
                    <p><span className="font-medium">تاريخ النهاية:</span> {form.endDate || '-'}</p>
                    <p><span className="font-medium">مهندسين مدنيين:</span> {form.assignedCivilEngineers.length}</p>
                    <p><span className="font-medium">مهندسين معماريين:</span> {form.assignedArchEngineers.length}</p>
                    <p><span className="font-medium">الورشات:</span> {form.workshops.length}</p>
                    <p><span className="font-medium">الآليات:</span> {form.machinery.length}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6 border-t pt-4">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-1">
                    <ChevronRight size={18} /> السابق
                  </button>
                )}
                <div className="flex-1" />
                {step < 6 ? (
                  <button type="button" onClick={() => {
                    if (step === 1 && !form.title) return toast.error('يرجى إدخال عنوان المشروع');
                    setStep(s => s + 1);
                  }} className="btn-primary flex items-center gap-1">
                    التالي <ChevronLeft size={18} />
                  </button>
                ) : (
                  <button type="submit" className="btn-primary flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <Check size={18} /> إنشاء المشروع
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {total > 10 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-600">إجمالي: {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1">السابق</button>
            <span className="px-3 py-1 text-sm">{page} / {Math.ceil(total / 10)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 10)}
              className="btn-secondary text-sm px-3 py-1">التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
