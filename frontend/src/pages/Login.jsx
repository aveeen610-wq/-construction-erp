import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, HardHat } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { login, adminLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isAdminLogin) {
        const res = await adminLogin(adminEmail, adminPassword);
        toast.success(`مرحباً ${res.user.fullName}`);
        navigate('/admin');
      } else {
        const res = await login(email, password);
        toast.success(`مرحباً ${res.user.fullName}`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <HardHat size={40} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">تسجيل الدخول</h1>
          <p className="text-gray-500 mt-1">منصة إدارة شركات المقاولات</p>
        </div>

        <div className="card">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsAdminLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isAdminLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              مستخدم
            </button>
            <button
              onClick={() => setIsAdminLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isAdminLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              مشرف عام
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isAdminLogin ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="********"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="input-field"
                    placeholder="admin@platform.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="input-field"
                    placeholder="********"
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              <LogIn size={20} />
              {loading ? 'جاري...' : 'تسجيل دخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              سجل شركتك الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
