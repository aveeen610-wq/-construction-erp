import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../services/api';
import { Building2, ArrowRight, HardHat, MapPin, Phone, Mail, Megaphone } from 'lucide-react';
import ImageSlider from '../components/ImageSlider';

export default function PublicCompany() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicApi.getCompany(id),
      publicApi.getCompanyAnnouncements(id)
    ])
      .then(([compRes, annRes]) => {
        setData(compRes.data);
        setAnnouncements(annRes.data || []);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">جاري التحميل...</div>;
  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">الشركة غير موجودة</p>
      <Link to="/" className="btn-primary">العودة للرئيسية</Link>
    </div>
  );

  const { company, works } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50" dir="rtl">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowRight size={20} />
            <span>العودة</span>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            <span className="text-lg font-bold text-gray-800">{company.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="card mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={40} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
              <p className="text-gray-500 mt-1">{company.description || 'شركة مقاولات'}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                {company.contactInfo?.phone && <span className="flex items-center gap-1"><Phone size={14} /> {company.contactInfo.phone}</span>}
                {company.contactInfo?.email && <span className="flex items-center gap-1"><Mail size={14} /> {company.contactInfo.email}</span>}
                {company.contactInfo?.address && <span className="flex items-center gap-1"><MapPin size={14} /> {company.contactInfo.address}</span>}
              </div>
            </div>
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Megaphone size={24} className="text-amber-600" />
              الإعلانات
            </h2>
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann._id} className="card-hover border-r-4 border-amber-400 overflow-hidden">
                  {ann.images?.length > 0 && (
                    <ImageSlider images={ann.images} className="rounded-none rounded-t-xl" />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800">{ann.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{ann.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(ann.createdAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <HardHat size={24} className="text-blue-600" />
          المشاريع المنفذة
        </h2>

        {works.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p>لا توجد مشاريع منجزة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map(work => (
              <div key={work._id} className="card-hover overflow-hidden">
                {work.images?.length > 0 && (
                  <ImageSlider images={work.images} className="rounded-none" interval={5000} />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{work.title}</h3>
                  {work.description && <p className="text-sm text-gray-600 line-clamp-2">{work.description}</p>}
                  {work.completionDate && (
                    <p className="text-xs text-gray-400 mt-2">{work.completionDate?.split('T')[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-6 text-center text-sm text-gray-400">
        &copy; 2026 جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
