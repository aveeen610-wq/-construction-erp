import { useState, useEffect } from 'react';
import { attendance } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogIn, LogOut, CalendarCheck, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date: '', leaveType: 'annual', notes: '' });
  const isHR = user?.role === 'hr' || user?.role === 'owner' || user?.role === 'manager';

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const fetchRecords = async () => {
    try {
      const res = await attendance.getMyLog({ month, year });
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load attendance');
    }
  };

  useEffect(() => { fetchRecords(); }, [month, year]);

  const handleCheckIn = async () => {
    try {
      await attendance.checkIn();
      toast.success('تم تسجيل الحضور');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تسجيل الحضور');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendance.checkOut();
      toast.success('تم تسجيل الخروج');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تسجيل الخروج');
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    try {
      await attendance.leaveRequest(leaveForm);
      toast.success('تم تقديم طلب الإجازة');
      setShowLeaveModal(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تقديم الطلب');
    }
  };

  const tileContent = ({ date: tileDate }) => {
    const dateStr = tileDate.toISOString().split('T')[0];
    const record = records.find(r => r.date === dateStr);
    if (!record) return null;
    const colors = {
      present: 'bg-emerald-500',
      absent: 'bg-red-500',
      late: 'bg-amber-500',
      leave: 'bg-yellow-500'
    };
    return <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${colors[record.status] || 'bg-gray-300'}`} />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">نظام الحضور والغياب</h1>
        <div className="flex gap-2">
          <button onClick={handleCheckIn} className="btn-success flex items-center gap-2">
            <LogIn size={18} />
            تسجيل دخول
          </button>
          <button onClick={handleCheckOut} className="btn-secondary flex items-center gap-2">
            <LogOut size={18} />
            تسجيل خروج
          </button>
          <button onClick={() => setShowLeaveModal(true)} className="btn-primary flex items-center gap-2">
            <Send size={18} />
            طلب إجازة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">تقويم الحضور - {month}/{year}</h3>
          <Calendar
            onChange={setDate}
            value={date}
            tileContent={tileContent}
            className="w-full border-0"
          />
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> حضور</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> غياب</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /> تأخير</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> إجازة</span>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">سجل الحضور</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.map(rec => (
              <div key={rec._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{rec.date}</span>
                  <span className={`mr-2 badge ${
                    rec.status === 'present' ? 'badge-success' :
                    rec.status === 'leave' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {rec.status === 'present' ? 'حضور' : rec.status === 'leave' ? 'إجازة' : 'غياب'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {rec.checkIn && <span>دخول: {rec.checkIn}</span>}
                  {rec.checkOut && <span className="mr-2">خروج: {rec.checkOut}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">طلب إجازة</h2>
            <form onSubmit={handleLeaveRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input type="date" value={leaveForm.date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجازة</label>
                <select value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="input-field">
                  <option value="annual">سنوية</option>
                  <option value="sick">مرضية</option>
                  <option value="exceptional">استثنائية</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={leaveForm.notes}
                  onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
                  className="input-field" rows="3" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إرسال الطلب</button>
                <button type="button" onClick={() => setShowLeaveModal(false)}
                  className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
