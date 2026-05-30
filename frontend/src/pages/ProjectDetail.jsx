import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projects, inventory } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, Users, FileText, Wrench, Truck, DollarSign, BarChart3, Package, X, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'other' });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ itemId: '', quantity: 1, unitPrice: 0 });
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const canEdit = user?.role === 'owner' || user?.role === 'manager' || user?.role === 'engineer';

  const loadProject = () => {
    projects.get(id)
      .then(res => { setProject(res.data); setNewProgress(res.data.progress); })
      .catch(() => toast.error('فشل تحميل المشروع'));
  };

  useEffect(() => { loadProject(); }, [id]);

  useEffect(() => {
    inventory.getItems({ limit: 200 }).then(res => setInventoryItems(res.data.items || [])).catch(() => {});
  }, []);

  const handleProgressUpdate = async () => {
    try {
      const res = await projects.updateProgress(id, newProgress);
      setProject(res.data);
      toast.success('تم تحديث نسبة الإنجاز');
    } catch (err) {
      toast.error('فشل التحديث');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await projects.addExpense(id, expenseForm);
      toast.success('تم إضافة المصروف');
      setShowExpenseForm(false);
      setExpenseForm({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'other' });
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إضافة المصروف');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await projects.addMaterial(id, materialForm);
      toast.success(res.data.message);
      setShowMaterialForm(false);
      setMaterialForm({ itemId: '', quantity: 1, unitPrice: 0 });
      loadProject();
      inventory.getItems({ limit: 200 }).then(res2 => setInventoryItems(res2.data.items || [])).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إضافة المادة');
    }
  };

  const openEditForm = () => {
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      clientName: project.clientName || '',
      clientPhone: project.clientPhone || '',
      location: project.location || '',
      budget: project.budget || 0,
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      status: project.status || 'active'
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await projects.update(id, editForm);
      toast.success('تم تحديث المشروع');
      setShowEditForm(false);
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل التحديث');
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز 10 ميغابايت');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      await projects.uploadFile(id, formData);
      toast.success('تم رفع الملف');
      loadProject();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل رفع الملف');
    }
    e.target.value = '';
  };

  if (!project) return <div className="text-center py-12">جاري التحميل...</div>;

  const categoryLabels = { materials: 'مواد', labor: 'عمالة', machinery: 'آليات', workshop: 'ورشات', transport: 'نقل', permits: 'تراخيص', other: 'أخرى' };

  return (
    <div>
      <button onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
        <ArrowLeft size={20} />
        <span>العودة للمشاريع</span>
      </button>

      <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
              {canEdit && (
                <button onClick={openEditForm} className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit size={18} />
                </button>
              )}
            </div>
            <p className="text-gray-500 mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/projects/${id}/report`} className="btn-secondary text-sm flex items-center gap-1">
              <BarChart3 size={16} /> تقرير
            </Link>
            <span className={`badge ${
              project.status === 'active' ? 'badge-success' :
              project.status === 'completed' ? 'badge-success' :
              project.status === 'planned' ? 'badge-info' : 'badge-warning'
            }`}>{project.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div><span className="text-sm text-gray-500">العميل</span><p className="font-medium">{project.clientName || '-'}</p></div>
          <div><span className="text-sm text-gray-500">الميزانية</span><p className="font-medium">{project.budget?.toLocaleString()} ريال</p></div>
          <div><span className="text-sm text-gray-500">تاريخ البداية</span><p className="font-medium">{project.startDate?.split('T')[0] || '-'}</p></div>
          <div><span className="text-sm text-gray-500">تاريخ النهاية</span><p className="font-medium">{project.endDate?.split('T')[0] || '-'}</p></div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">نسبة الإنجاز: <strong>{project.progress}%</strong></span>
            {canEdit && (
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="100" value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="w-32" />
                <span>{newProgress}%</span>
                <button onClick={handleProgressUpdate} className="btn-primary text-sm px-3 py-1">تحديث</button>
              </div>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {project.phases?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold mb-3">مراحل المشروع</h3>
            <div className="space-y-2">
              {project.phases.map((phase, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{phase.name}</span>
                    <span className="text-sm">{phase.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${phase.progress}%` }} />
                  </div>
                  {phase.cost > 0 && <p className="text-sm text-gray-500 mt-1">التكلفة: {phase.cost} ريال</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Users size={20} /> فريق العمل</h3>
          <div className="space-y-3">
            {project.civilEngineers?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">مهندسين مدنيين:</p>
                {project.civilEngineers.map(e => (
                  <div key={e._id} className="p-2 bg-blue-50 rounded-lg text-sm mb-1">{e.fullName}</div>
                ))}
              </div>
            )}
            {project.archEngineers?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">مهندسين معماريين:</p>
                {project.archEngineers.map(e => (
                  <div key={e._id} className="p-2 bg-amber-50 rounded-lg text-sm mb-1">{e.fullName}</div>
                ))}
              </div>
            )}
            {project.engineers?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مهندسين آخرين:</p>
                {project.engineers.map(e => (
                  <div key={e._id} className="p-2 bg-gray-50 rounded-lg text-sm mb-1">{e.fullName}</div>
                ))}
              </div>
            )}
            {project.workers?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">العمال:</p>
                {project.workers.map(w => (
                  <div key={w._id} className="p-2 bg-gray-50 rounded-lg text-sm mb-1">{w.fullName}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(project.workshops?.length > 0 || project.machinery?.length > 0) && (
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Wrench size={20} /> الورشات والآليات</h3>
            {project.workshops?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">الورشات:</p>
                {project.workshops.map((w, i) => (
                  <div key={i} className="p-2 bg-indigo-50 rounded-lg text-sm mb-1">
                    {w.name} {w.specialization && `- ${w.specialization}`} {w.phone && `(${w.phone})`}
                  </div>
                ))}
              </div>
            )}
            {project.machinery?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">الآليات والمعدات:</p>
                {project.machinery.map((m, i) => (
                  <div key={i} className="p-2 bg-emerald-50 rounded-lg text-sm mb-1 flex justify-between">
                    <span>{m.name} {m.type && `(${m.type})`} x{m.quantity}</span>
                    {m.rentalCost > 0 && <span>{m.rentalCost} ريال</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><DollarSign size={20} /> المصروفات</h3>
            {canEdit && (
              <button onClick={() => setShowExpenseForm(true)} className="btn-primary text-sm px-3 py-1">إضافة مصروف</button>
            )}
          </div>
          <div className="mb-3 p-3 bg-blue-50 rounded-lg flex justify-between">
            <span className="font-medium">إجمالي المصروفات</span>
            <span className="font-bold text-blue-700">{project.totalSpent?.toLocaleString()} ريال</span>
          </div>
          {project.expenses?.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {project.expenses.map((exp, i) => (
                <div key={exp._id || i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{exp.description}</p>
                    <p className="text-xs text-gray-500">{exp.date} - {categoryLabels[exp.category] || exp.category}</p>
                  </div>
                  <span className="font-mono text-red-600">{exp.amount.toLocaleString()} ريال</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد مصروفات بعد</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Package size={20} /> المواد المستخدمة</h3>
            {canEdit && (
              <button onClick={() => setShowMaterialForm(true)} className="btn-primary text-sm px-3 py-1">إضافة مادة</button>
            )}
          </div>
          {project.materials?.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {project.materials.map((mat, i) => (
                <div key={mat._id || i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{mat.itemName}</p>
                    <p className="text-xs text-gray-500">{mat.date} - {mat.quantity} × {mat.unitPrice?.toLocaleString()} ريال</p>
                  </div>
                  <span className="font-mono text-orange-600">{mat.total?.toLocaleString()} ريال</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد مواد مستخدمة بعد</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2"><FileText size={20} /> الملفات</h3>
          <div className="text-center">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" onChange={handleFileUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-8 w-full text-center cursor-pointer hover:border-blue-400 border-gray-300 transition-colors">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">اضغط لاختيار ملف</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (حد أقصى 10MB)</p>
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {project.attachments?.map((att, idx) => (
              <a key={idx} href={att} target="_blank" rel="noopener noreferrer"
                className="block p-2 bg-gray-50 rounded-lg text-sm text-blue-600 hover:bg-blue-50">
                {att.split('/').pop()}
              </a>
            ))}
          </div>
        </div>
      </div>

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">إضافة مصروف</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البيان *</label>
                <input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
                  <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="input-field" required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="input-field">
                  <option value="materials">مواد</option>
                  <option value="labor">عمالة</option>
                  <option value="machinery">آليات</option>
                  <option value="workshop">ورشات</option>
                  <option value="transport">نقل</option>
                  <option value="permits">تراخيص</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إضافة</button>
                <button type="button" onClick={() => setShowExpenseForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">إضافة مادة من المخزون</h2>
              <button onClick={() => setShowMaterialForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة *</label>
                <select value={materialForm.itemId} onChange={(e) => {
                  const item = inventoryItems.find(i => i._id === e.target.value);
                  setMaterialForm({ ...materialForm, itemId: e.target.value, unitPrice: item?.unitPrice || 0 });
                }} className="input-field" required>
                  <option value="">اختر المادة...</option>
                  {inventoryItems.filter(i => i.currentQty > 0).map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.code}) - متوفر: {item.currentQty} {item.unit || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية *</label>
                  <input type="number" value={materialForm.quantity} onChange={(e) => setMaterialForm({ ...materialForm, quantity: Number(e.target.value) })}
                    className="input-field" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر القطعة *</label>
                  <input type="number" value={materialForm.unitPrice} onChange={(e) => setMaterialForm({ ...materialForm, unitPrice: Number(e.target.value) })}
                    className="input-field" required min="0" />
                </div>
              </div>
              {materialForm.itemId && materialForm.quantity > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>الإجمالي:</span>
                    <span className="font-bold text-blue-700">{(materialForm.quantity * materialForm.unitPrice).toLocaleString()} ريال</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إضافة وخصم من المخزون</button>
                <button type="button" onClick={() => setShowMaterialForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">تعديل المشروع</h2>
              <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المشروع *</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
                  <input value={editForm.clientName} onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">جوال العميل</label>
                  <input value={editForm.clientPhone} onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الميزانية</label>
                  <input type="number" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                    className="input-field" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field">
                    <option value="planned">مخطط</option>
                    <option value="active">نشط</option>
                    <option value="on_hold">معلق</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البداية</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النهاية</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">حفظ التعديلات</button>
                <button type="button" onClick={() => setShowEditForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
