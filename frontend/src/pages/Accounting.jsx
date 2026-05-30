import { useState, useEffect } from 'react';
import { accounting } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, Plus, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Accounting() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [income, setIncome] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({ accountCode: '', accountName: '', type: 'asset', balance: 0 });

  const fetchData = async (tab) => {
    try {
      if (tab === 'accounts') {
        const res = await accounting.getAccounts();
        setAccounts(res.data);
      } else if (tab === 'entries') {
        const res = await accounting.getJournalEntries({ limit: 20 });
        setEntries(res.data.entries);
      } else if (tab === 'balance') {
        const res = await accounting.getBalanceSheet();
        setBalanceSheet(res.data);
      } else if (tab === 'income') {
        const res = await accounting.getIncomeStatement();
        setIncome(res.data);
      }
    } catch (err) {
      console.error('Failed to load accounting data');
    }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await accounting.createAccount(accountForm);
      toast.success('تم إضافة الحساب');
      setShowAccountForm(false);
      setAccountForm({ accountCode: '', accountName: '', type: 'asset', balance: 0 });
      fetchData('accounts');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الإضافة');
    }
  };

  const tabs = [
    { id: 'accounts', label: 'دليل الحسابات' },
    { id: 'entries', label: 'القيود اليومية' },
    { id: 'balance', label: 'ميزانية مراجعة' },
    { id: 'income', label: 'قائمة دخل' }
  ];

  const typeLabels = { asset: 'أصل', liability: 'خصم', equity: 'حقوق ملكية', revenue: 'إيراد', expense: 'مصروف' };
  const typeColors = {
    asset: 'text-blue-600 bg-blue-50',
    liability: 'text-red-600 bg-red-50',
    equity: 'text-green-600 bg-green-50',
    revenue: 'text-emerald-600 bg-emerald-50',
    expense: 'text-orange-600 bg-orange-50'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">نظام المحاسبة</h1>
        {activeTab === 'accounts' && (
          <button onClick={() => setShowAccountForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            إضافة حساب
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-right p-3 text-sm font-semibold">الكود</th>
                  <th className="text-right p-3 text-sm font-semibold">الاسم</th>
                  <th className="text-right p-3 text-sm font-semibold">النوع</th>
                  <th className="text-left p-3 text-sm font-semibold">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc._id} className="border-b border-gray-100">
                    <td className="p-3 font-mono text-sm">{acc.accountCode}</td>
                    <td className="p-3 font-medium">{acc.accountName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${typeColors[acc.type]}`}>
                        {typeLabels[acc.type]}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono">{acc.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'entries' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-right p-3 text-sm font-semibold">رقم القيد</th>
                  <th className="text-right p-3 text-sm font-semibold">التاريخ</th>
                  <th className="text-right p-3 text-sm font-semibold">الوصف</th>
                  <th className="text-left p-3 text-sm font-semibold">مدين</th>
                  <th className="text-left p-3 text-sm font-semibold">دائن</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry._id} className="border-b border-gray-100">
                    <td className="p-3 font-mono text-sm">{entry.entryNumber}</td>
                    <td className="p-3 text-sm">{entry.date?.split('T')[0]}</td>
                    <td className="p-3 text-sm text-gray-600">{entry.description}</td>
                    <td className="p-3 text-left font-mono text-sm text-red-600">{entry.totalDebit.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono text-sm text-green-600">{entry.totalCredit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'balance' && balanceSheet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-bold text-blue-600 mb-3">الأصول</h3>
            {balanceSheet.assets.accounts.map(a => (
              <div key={a._id} className="flex justify-between py-1 text-sm"><span>{a.accountName}</span><span>{a.balance.toLocaleString()}</span></div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-sm"><span>الإجمالي</span><span>{balanceSheet.assets.total.toLocaleString()}</span></div>
          </div>
          <div className="card">
            <h3 className="font-bold text-red-600 mb-3">الخصوم</h3>
            {balanceSheet.liabilities.accounts.map(a => (
              <div key={a._id} className="flex justify-between py-1 text-sm"><span>{a.accountName}</span><span>{a.balance.toLocaleString()}</span></div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-sm"><span>الإجمالي</span><span>{balanceSheet.liabilities.total.toLocaleString()}</span></div>
          </div>
          <div className="card">
            <h3 className="font-bold text-green-600 mb-3">حقوق الملكية</h3>
            {balanceSheet.equity.accounts.map(a => (
              <div key={a._id} className="flex justify-between py-1 text-sm"><span>{a.accountName}</span><span>{a.balance.toLocaleString()}</span></div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-sm"><span>الإجمالي</span><span>{balanceSheet.equity.total.toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {activeTab === 'income' && income && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-bold text-emerald-600 mb-3">الإيرادات</h3>
            {income.revenues.accounts.map(a => (
              <div key={a._id} className="flex justify-between py-1 text-sm"><span>{a.accountName}</span><span>{a.balance.toLocaleString()}</span></div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-sm"><span>الإجمالي</span><span className="text-emerald-600">{income.revenues.total.toLocaleString()}</span></div>
          </div>
          <div className="card">
            <h3 className="font-bold text-red-600 mb-3">المصروفات</h3>
            {income.expenses.accounts.map(a => (
              <div key={a._id} className="flex justify-between py-1 text-sm"><span>{a.accountName}</span><span>{a.balance.toLocaleString()}</span></div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-sm"><span>الإجمالي</span><span className="text-red-600">{income.expenses.total.toLocaleString()}</span></div>
          </div>
          <div className="card md:col-span-2 bg-gradient-to-r from-blue-50 to-emerald-50">
            <div className="flex justify-between text-lg font-bold">
              <span>صافي الدخل</span>
              <span className={income.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {income.netIncome.toLocaleString()} ريال
              </span>
            </div>
          </div>
        </div>
      )}

      {showAccountForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">إضافة حساب</h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود الحساب</label>
                <input value={accountForm.accountCode} onChange={(e) => setAccountForm({ ...accountForm, accountCode: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحساب</label>
                <input value={accountForm.accountName} onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                  className="input-field">
                  <option value="asset">أصل</option>
                  <option value="liability">خصم</option>
                  <option value="equity">حقوق ملكية</option>
                  <option value="revenue">إيراد</option>
                  <option value="expense">مصروف</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إضافة</button>
                <button type="button" onClick={() => setShowAccountForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
