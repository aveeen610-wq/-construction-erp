import { useState, useEffect } from 'react';
import { company, publicApi } from '../services/api';
import { Building2, Users, CheckCircle, XCircle, Search, Clock, MessageSquare, Mail, Phone, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [tab, setTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [messages, setMessages] = useState([]);
  const [works, setWorks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, worksRes] = await Promise.all([
          company.getAll(),
          publicApi.getWorks()
        ]);
        setCompanies(compRes.data);
        setWorks(worksRes.data);
      } catch (err) {
        toast.error('فشل تحميل البيانات');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === 'messages') {
      publicApi.getMessages().then(res => setMessages(res.data)).catch(() => {});
    }
  }, [tab]);

  const handleStatus = async (id, status) => {
    try {
      await company.updateStatus(id, status);
      toast.success(`تم ${status === 'active' ? 'تفعيل' : status === 'suspended' ? 'تعليق' : 'تحديث'} الشركة`);
      const res = await company.getAll();
      setCompanies(res.data);
    } catch (err) {
      toast.error('فشل التحديث');
    }
  };

  const markRead = async (id) => {
    try {
      await publicApi.markMessageRead(id);
      setMessages(msgs => msgs.map(m => m._id === id ? { ...m, read: true } : m));
    } catch {}
  };

  const pending = companies.filter(c => c.status === 'pending');
  const active = companies.filter(c => c.status === 'active');
  const suspended = companies.filter(c => c.status === 'suspended');
  const unread = messages.filter(m => !m.read).length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl"><Clock size={28} className="text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
              <p className="text-sm text-amber-600">بانتظار الموافقة</p>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl"><CheckCircle size={28} className="text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{active.length}</p>
              <p className="text-sm text-emerald-600">شركات نشطة</p>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><XCircle size={28} className="text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-red-700">{suspended.length}</p>
              <p className="text-sm text-red-600">شركات موقوفة</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200 cursor-pointer" onClick={() => setTab('messages')}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl"><MessageSquare size={28} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{unread}</p>
              <p className="text-sm text-purple-600">رسائل غير مقروءة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('companies')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'companies' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Building2 size={16} className="inline ml-1" /> الشركات
        </button>
        <button onClick={() => setTab('messages')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'messages' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <MessageSquare size={16} className="inline ml-1" /> الرسائل {unread > 0 && `(${unread})`}
        </button>
      </div>

      {tab === 'companies' && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">إدارة الشركات</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-right p-3 text-sm font-semibold">الشركة</th>
                  <th className="text-right p-3 text-sm font-semibold">السجل التجاري</th>
                  <th className="text-right p-3 text-sm font-semibold">الحالة</th>
                  <th className="text-left p-3 text-sm font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c._id} className="border-b border-gray-100">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.contactInfo?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{c.commercialReg}</td>
                    <td className="p-3">
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.status === 'active' ? 'نشط' : c.status === 'pending' ? 'قيد المراجعة' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        {c.status === 'pending' && (
                          <button onClick={() => handleStatus(c._id, 'active')}
                            className="btn-success text-sm px-3 py-1">تفعيل</button>
                        )}
                        {c.status === 'active' && (
                          <button onClick={() => handleStatus(c._id, 'suspended')}
                            className="btn-secondary text-sm px-3 py-1">تعليق</button>
                        )}
                        {c.status === 'suspended' && (
                          <button onClick={() => handleStatus(c._id, 'active')}
                            className="btn-success text-sm px-3 py-1">إعادة تفعيل</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">رسائل المطور</h3>
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">لا توجد رسائل</p>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg._id} className={`p-4 rounded-xl border ${msg.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{msg.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        {msg.email && <span className="flex items-center gap-1"><Mail size={14} /> {msg.email}</span>}
                        {msg.phone && <span className="flex items-center gap-1"><Phone size={14} /> {msg.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!msg.read && (
                        <button onClick={() => markRead(msg._id)} className="btn-secondary text-xs px-2 py-1" title="تحديد كمقروء">
                          <Eye size={14} />
                        </button>
                      )}
                      <span className="text-xs text-gray-400">{msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('ar') : ''}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


