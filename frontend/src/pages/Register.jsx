import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/api';
import { UserPlus, HardHat, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        phone: form.phone
      });
      setDone(true);
      toast.success('تم إرسال طلب التسجيل بنجاح');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 p-4 rounded-full">
                <CheckCircle size={48} className="text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">تم استلام طلب التسجيل</h1>
            <p className="text-gray-600 mb-2">
              شكراً لك {form.fullName}، تم استلام طلب تسجيل شركة <strong>{form.companyName}</strong>.
            </p>
            <p className="text-gray-500 mb-6">
              سيتم مراجعة طلبك من قبل الإدارة وتفعيل حسابك في أقرب وقت. سنرسل إشعاراً عند التفعيل.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 justify-center">
          <ArrowLeft size={20} />
          <span>العودة للرئيسية</span>
        </Link>

        <div className="card">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserPlus size={32} className="text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">تسجيل شركة جديدة</h1>
            <p className="text-gray-500 text-sm mt-1">سجّل شركتك، وبعد الموافقة ستتمكن من إدارة موظفيك ومشاريعك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" minLength="6" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" minLength="6" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة *</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className="input-field" placeholder="مثلاً: شركة البناء الحديث" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              بعد التسجيل، ستحتاج لانتظار موافقة الإدارة قبل تفعيل حسابك
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'تسجيل الشركة'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              تسجيل دخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
