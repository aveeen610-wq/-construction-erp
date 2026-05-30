import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Building2, LogIn, UserPlus, Briefcase, Shield, HardHat, Facebook, Instagram, Send, Phone, ChevronLeft, MapPin, Calendar, Star, Megaphone } from 'lucide-react';
import { toast } from 'react-toastify';
import ImageSlider from '../components/ImageSlider';

const slides = ['/images/slide1.jpg', '/images/slide2.png', '/images/slide3.png'];

export default function Landing() {
  const [companies, setCompanies] = useState([]);
  const [works, setWorks] = useState([]);
  const [ads, setAds] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ companies: 0, projects: 0, employees: 0 });
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, worksRes, adsRes, statsRes, annRes] = await Promise.all([
          publicApi.getCompanies(),
          publicApi.getWorks(),
          publicApi.getAds(),
          publicApi.getStats(),
          publicApi.getAllAnnouncements()
        ]);
        setCompanies(compRes.data);
        setWorks(worksRes.data);
        setAds(adsRes.data);
        setStats(statsRes.data);
        setAnnouncements(annRes.data || []);
      } catch (err) {
        console.error('Failed to load landing data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={28} />
            <span className="text-xl font-bold text-gray-800">{t('app.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/register" className="btn-secondary flex items-center gap-2 text-sm">
              <UserPlus size={18} />
              {t('nav.register')}
            </Link>
            <Link to="/login" className="btn-primary flex items-center gap-2 text-sm">
              <LogIn size={18} />
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {slides.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{ opacity: i === currentSlide ? 1 : 0 }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl text-white">
            <div className="flex mb-6">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <HardHat size={48} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {t('app.title')}
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mb-8">
              {t('app.subtitle')}
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-50 transition-all text-lg">
                إنشاء حساب جديد
              </Link>
              <Link to="/login" className="bg-white/20 text-white border border-white/40 backdrop-blur-sm px-8 py-3 rounded-xl hover:bg-white/30 transition-all text-lg">
                {t('nav.login')}
              </Link>
            </div>
            <div className="flex items-center gap-8 mt-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.companies}</p>
                <p className="text-sm text-white/70">شركة مسجلة</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.projects}</p>
                <p className="text-sm text-white/70">مشروع</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{stats.employees}</p>
                <p className="text-sm text-white/70">مهندس وموظف</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-hover text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&q=80" alt="Project management" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">إدارة المشاريع</h3>
            <p className="text-sm text-gray-600">تابع مراحل المشاريع ونسب الإنجاز والمخططات والصور في مكان واحد</p>
          </div>
          <div className="card-hover text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=150&q=80" alt="Accounting" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">إدارة مالية ومحاسبية</h3>
            <p className="text-sm text-gray-600">نظام محاسبي متكامل مع دليل حسابات وقيود يومية وتقارير مالية</p>
          </div>
          <div className="card-hover text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&q=80" alt="Inventory" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">إدارة المخزون والمستودعات</h3>
            <p className="text-sm text-gray-600">تتبع المواد وحركات المخزون مع إنذارات عند انخفاض الكميات</p>
          </div>
        </div>
      </section>

      {companies.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">الشركات المسجلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map(company => (
                <Link key={company._id} to={`/company/${company._id}`} className="card-hover flex items-center gap-4 p-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={28} className="text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{company.name}</h3>
                    {company.description && (
                      <p className="text-sm text-gray-500 truncate">{company.description}</p>
                    )}
                    {company.specialization?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {company.specialization.slice(0, 2).map(s => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronLeft size={20} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {ads.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl p-6 text-white text-center">
            {ads.map(ad => (
              <div key={ad._id}>
                <h3 className="text-xl font-bold">{isRtl ? ad.titleAr || ad.title : ad.title}</h3>
                <p>{isRtl ? ad.contentAr || ad.content : ad.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">الأعمال المنفذة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map(work => (
                <div key={work._id} className="card-hover overflow-hidden group">
                  {work.images?.length > 0 ? (
                    <ImageSlider images={work.images} interval={5000} />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                      <HardHat size={48} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{work.title}</h3>
                      {work.isFeatured && (
                        <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>
                    {(work.location || work.completionDate) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        {work.location && <span className="flex items-center gap-1"><MapPin size={12} />{work.location}</span>}
                        {work.completionDate && <span className="flex items-center gap-1"><Calendar size={12} />{work.completionDate?.split('T')[0]}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {announcements.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
              <Megaphone size={28} className="text-amber-600" />
              الإعلانات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map(ann => (
                <Link key={ann._id} to={`/company/${ann.companyId}`} className="card-hover overflow-hidden group block">
                  {ann.images?.length > 0 ? (
                    <ImageSlider images={ann.images} interval={4000} />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                      <Megaphone size={48} className="text-amber-200" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone size={14} className="text-amber-500 shrink-0" />
                      <h3 className="font-bold text-gray-800">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      {ann.company?.name && <span className="text-blue-600 font-medium">{ann.company.name}</span>}
                      <span>{new Date(ann.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1565008447742-97f6f30c0b9e?w=1920&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">انضم إلى منصة إدارة شركات المقاولات</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            سجّل شركتك الآن وابدأ بإدارة مشاريعك وموظفيك وحساباتك في نظام متكامل
          </p>
          <Link to="/register" className="inline-block bg-white text-blue-700 font-bold px-10 py-4 rounded-xl text-lg shadow-xl hover:bg-blue-50 transition-all">
            أنشئ حسابك مجاناً
          </Link>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">مطور المنصة</h2>
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex flex-col items-center text-center flex-1">
              <img src="/images/developer.png" alt="مطور المنصة"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg" />
              <h3 className="text-xl font-bold text-gray-800 mt-3">محمود أحمد الصالح العلي</h3>
              <p className="text-gray-500 text-sm">مطور و مصمم أنظمة ERP</p>
              <div className="flex items-center gap-6 mt-4">
                <a href="tel:0931851841" className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors" title="0931851841">
                  <Phone size={20} />
                </a>
                <a href="https://facebook.com/mahmod.alsaleeh.alali" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <Facebook size={22} />
                </a>
                <a href="https://instagram.com/4x8_6" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 transition-colors">
                  <Instagram size={22} />
                </a>
              </div>
            </div>
            <div className="flex-1 w-full max-w-md">
              <h3 className="font-bold text-gray-800 mb-4 text-center lg:text-right">تواصل مع المطور</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                  await publicApi.sendContact(Object.fromEntries(fd));
                  toast.success('تم إرسال رسالتك');
                  e.target.reset();
                } catch (err) {
                  toast.error(err.response?.data?.error || 'فشل الإرسال');
                }
              }} className="space-y-3">
                <input name="name" placeholder="الاسم *" required className="input-field" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="email" type="email" placeholder="البريد الإلكتروني" className="input-field" />
                  <input name="phone" placeholder="رقم الجوال" className="input-field" />
                </div>
                <textarea name="message" placeholder="رسالتك *" required rows="3" className="input-field" />
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send size={18} /> إرسال
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={24} className="text-blue-400" />
              <span className="text-lg font-bold">{t('app.title')}</span>
            </div>
            <p className="text-gray-400 text-sm">{t('app.subtitle')}</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">روابط سريعة</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link to="/" className="block hover:text-white">{t('nav.home')}</Link>
              <Link to="/login" className="block hover:text-white">{t('nav.login')}</Link>
              <Link to="/register" className="block hover:text-white">{t('nav.register')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-3">تواصل معنا</h4>
            <p className="text-sm text-gray-400">contact@construction-erp.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; 2026 {t('app.title')}. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
