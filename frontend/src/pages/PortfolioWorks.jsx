import { useState, useEffect, useRef } from 'react';
import { portfolio } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Images, Plus, Star, X, Upload, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import ImageSlider from '../components/ImageSlider';

export default function PortfolioWorks() {
  const [works, setWorks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', category: '', completionDate: '', isFeatured: false });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const { isOwner, isManager } = useAuth();
  const canEdit = isOwner || isManager;

  useEffect(() => {
    portfolio.getAll()
      .then(res => setWorks(res.data))
      .catch(() => toast.error('فشل تحميل الأعمال'));
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
      fd.append('description', form.description);
      fd.append('location', form.location);
      fd.append('category', form.category);
      if (form.completionDate) fd.append('completionDate', form.completionDate);
      fd.append('isFeatured', form.isFeatured);
      images.forEach(img => fd.append('images', img));

      await portfolio.create(fd);
      toast.success('تم إضافة العمل');
      setShowForm(false);
      setForm({ title: '', description: '', location: '', category: '', completionDate: '', isFeatured: false });
      setImages([]);
      setPreviews([]);
      const res = await portfolio.getAll();
      setWorks(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الإضافة');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">الأعمال المنفذة</h1>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            إضافة عمل
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map(work => (
          <div key={work._id} className="card-hover overflow-hidden group">
            {work.images?.length > 0 ? (
              <ImageSlider images={work.images} className="rounded-none" interval={5000} />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <Images size={48} className="text-gray-300" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-800">{work.title}</h3>
                {work.isFeatured && (
                  <Star size={16} className="text-amber-500 shrink-0" fill="currentColor" />
                )}
              </div>
              {work.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                {work.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {work.location}
                  </span>
                )}
                {work.completionDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {work.completionDate?.split('T')[0]}
                  </span>
                )}
              </div>
              {work.category && (
                <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {work.category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">إضافة عمل منفذ</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التنفيذ</label>
                  <input type="date" value={form.completionDate} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-5 h-5 text-amber-500 rounded" />
                    <span className="text-sm">عمل مميز</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صور العمل</label>
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
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إضافة</button>
                <button type="button" onClick={() => { setShowForm(false); setImages([]); setPreviews([]); }} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
