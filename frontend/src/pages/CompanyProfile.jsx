import { useState, useEffect, useRef } from 'react';
import { company } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Upload, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CompanyProfile() {
  const { isOwner } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', commercialReg: '', taxNumber: '', contactInfo: { phone: '', email: '', address: '' } });
  const logoRef = useRef(null);

  useEffect(() => {
    company.getProfile().then(res => {
      const d = res.data;
      setProfile(d);
      setForm({
        name: d.name || '',
        description: d.description || '',
        commercialReg: d.commercialReg || '',
        taxNumber: d.taxNumber || '',
        contactInfo: {
          phone: d.contactInfo?.phone || '',
          email: d.contactInfo?.email || '',
          address: d.contactInfo?.address || ''
        }
      });
    }).catch(() => toast.error('فشل تحميل بيانات الشركة'));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await company.updateProfile(form);
      setProfile(res.data);
      toast.success('تم حفظ التغييرات');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الحفظ');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const res = await company.uploadLogo(fd);
      setProfile(res.data.company);
      toast.success('تم رفع الشعار');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل رفع الشعار');
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">الملف التعريفي للشركة</h1>

      <div className="card mb-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
            {profile?.logo ? (
              <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={48} className="text-gray-300" />
            )}
          </div>
          {isOwner && (
            <div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button onClick={() => logoRef.current?.click()} className="btn-secondary text-sm flex items-center gap-1">
                <Upload size={16} /> تغيير الشعار
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h3 className="font-bold text-gray-800">بيانات الشركة</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السجل التجاري</label>
            <input value={form.commercialReg} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
            <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
              className="input-field" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field" rows="3" />
        </div>

        <h3 className="font-bold text-gray-800 pt-2 border-t">معلومات الاتصال</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجوال</label>
            <input value={form.contactInfo.phone} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, phone: e.target.value } })}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.contactInfo.email} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })}
              className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <input value={form.contactInfo.address} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })}
              className="input-field" />
          </div>
        </div>

        {isOwner && (
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save size={18} /> حفظ التغييرات
          </button>
        )}
      </form>
    </div>
  );
}