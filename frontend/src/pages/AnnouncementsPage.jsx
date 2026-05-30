import { useState, useEffect, useRef } from 'react';
import { announcements } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Plus, X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AnnouncementsPage() {
  const [list, setList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetRole: 'all' });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const { isOwner, isManager } = useAuth();
  const canEdit = isOwner || isManager;

  useEffect(() => {
    announcements.getAll()
      .then(res => setList(res.data))
      .catch(() => toast.error('فشل تحميل الإعلانات'));
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...images, ...files];
    setImages(newImages);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('targetRole', form.targetRole);
      images.forEach(img => fd.append('images', img));

      await announcements.create(fd);
      toast.success('تم نشر الإعلان');
      setShowForm(false);
      setForm({ title: '', content: '', targetRole: 'all' });
      setImages([]);
      setPreviews([]);
      const res = await announcements.getAll();
      setList(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل النشر');
    }
  };

  const roleLabels = {
    all: 'الكل',
    engineer: 'مهندسين',
    accountant: 'محاسبين',
    hr: 'موارد بشرية',
    inventory: 'مخزن',
    employee: 'موظفين'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">الإعلانات</h1>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            إعلان جديد
          </button>
        )}
      </div>

      <div className="space-y-4">
        {list.map(ad => (
          <div key={ad._id} className="card-hover border-r-4 border-blue-500">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{ad.title}</h3>
                <span className="badge-info text-xs">{roleLabels[ad.targetRole] || ad.targetRole}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{ad.content}</p>
            {ad.images?.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {ad.images.map((img, i) => (
                  <img key={i} src={img} alt=""
                    className="w-32 h-24 object-cover rounded-lg shrink-0" />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{new Date(ad.createdAt).toLocaleDateString('ar-SA')}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إعلان جديد</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" rows="4" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الصور</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">اضغط لاختيار صور</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {previews.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p} alt="" className="w-20 h-16 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">يظهر لـ</label>
                <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="input-field">
                  <option value="all">الكل</option>
                  <option value="engineer">المهندسين</option>
                  <option value="accountant">المحاسبين</option>
                  <option value="hr">الموارد البشرية</option>
                  <option value="inventory">المخزون</option>
                  <option value="employee">الموظفين</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">نشر</button>
                <button type="button" onClick={() => { setShowForm(false); setImages([]); setPreviews([]); }} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
