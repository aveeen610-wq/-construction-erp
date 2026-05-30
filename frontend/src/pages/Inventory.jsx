import { useState, useEffect } from 'react';
import { inventory } from '../services/api';
import { Package, Plus, ArrowDownUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [itemForm, setItemForm] = useState({ code: '', name: '', unit: 'piece', minQty: 0, maxQty: 0, currentQty: 0, unitPrice: 0 });
  const [transForm, setTransForm] = useState({ itemId: '', type: 'in', qty: 1, notes: '' });

  const fetchData = async (tab) => {
    try {
      if (tab === 'items') {
        const res = await inventory.getItems({ limit: 50 });
        setItems(res.data.items);
      } else if (tab === 'transactions') {
        const res = await inventory.getTransactions({ limit: 50 });
        setTransactions(res.data.transactions);
      } else if (tab === 'lowstock') {
        const res = await inventory.getLowStock();
        setLowStock(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory');
    }
  };

  useEffect(() => { fetchData(activeTab); }, [activeTab]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await inventory.createItem(itemForm);
      toast.success('تم إضافة الصنف');
      setShowItemForm(false);
      setItemForm({ code: '', name: '', unit: 'piece', minQty: 0, maxQty: 0, currentQty: 0, unitPrice: 0 });
      fetchData('items');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الإضافة');
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await inventory.createTransaction(transForm);
      toast.success('تم تسجيل الحركة');
      setShowTransForm(false);
      setTransForm({ itemId: '', type: 'in', qty: 1, notes: '' });
      fetchData('items');
      fetchData('transactions');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل التسجيل');
    }
  };

  const tabs = [
    { id: 'items', label: 'الأصناف', icon: Package },
    { id: 'transactions', label: 'الحركات', icon: ArrowDownUp },
    { id: 'lowstock', label: 'إنذار المخزون', icon: AlertTriangle }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المخزون</h1>
        <div className="flex gap-2">
          {activeTab === 'items' && (
            <button onClick={() => setShowItemForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={20} /> إضافة صنف
            </button>
          )}
          {activeTab === 'transactions' && (
            <button onClick={() => setShowTransForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={20} /> حركة جديدة
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'items' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-right p-3 text-sm font-semibold">الكود</th>
                  <th className="text-right p-3 text-sm font-semibold">الاسم</th>
                  <th className="text-right p-3 text-sm font-semibold">الوحدة</th>
                  <th className="text-center p-3 text-sm font-semibold">الكمية</th>
                  <th className="text-center p-3 text-sm font-semibold">الحد الأدنى</th>
                  <th className="text-center p-3 text-sm font-semibold">الحد الأقصى</th>
                  <th className="text-left p-3 text-sm font-semibold">السعر</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id} className={`border-b border-gray-100 ${item.currentQty <= item.minQty ? 'bg-red-50' : ''}`}>
                    <td className="p-3 font-mono text-sm">{item.code}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-sm">{item.unit}</td>
                    <td className={`p-3 text-center font-bold ${item.currentQty <= item.minQty ? 'text-red-600' : 'text-gray-800'}`}>
                      {item.currentQty}
                    </td>
                    <td className="p-3 text-center text-sm">{item.minQty}</td>
                    <td className="p-3 text-center text-sm">{item.maxQty}</td>
                    <td className="p-3 text-left">{item.unitPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-right p-3 text-sm font-semibold">الصنف</th>
                  <th className="text-right p-3 text-sm font-semibold">النوع</th>
                  <th className="text-center p-3 text-sm font-semibold">الكمية</th>
                  <th className="text-right p-3 text-sm font-semibold">المشروع</th>
                  <th className="text-right p-3 text-sm font-semibold">التاريخ</th>
                  <th className="text-right p-3 text-sm font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{t.itemId?.name}</td>
                    <td className="p-3">
                      <span className={`badge ${t.type === 'in' ? 'badge-success' : t.type === 'out' ? 'badge-danger' : 'badge-info'}`}>
                        {t.type === 'in' ? 'إضافة' : t.type === 'out' ? 'صرف' : 'تحويل'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{t.qty}</td>
                    <td className="p-3 text-sm">{t.projectId?.title || '-'}</td>
                    <td className="p-3 text-sm">{t.date?.split('T')[0]}</td>
                    <td className="p-3 text-sm text-gray-600">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="card">
          {lowStock.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد مواد تحت الحد الأدنى</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map(item => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <span className="font-bold text-red-700">{item.name}</span>
                    <p className="text-sm text-red-600">الكود: {item.code} | الوحدة: {item.unit}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-red-600">الكمية الحالية: <strong>{item.currentQty}</strong></p>
                    <p className="text-sm text-red-600">الحد الأدنى: <strong>{item.minQty}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">إضافة صنف</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكود *</label>
                  <input value={itemForm.code} onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                  <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
                  <input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الابتدائية</label>
                  <input type="number" value={itemForm.currentQty} onChange={(e) => setItemForm({ ...itemForm, currentQty: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label>
                  <input type="number" value={itemForm.minQty} onChange={(e) => setItemForm({ ...itemForm, minQty: Number(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى</label>
                  <input type="number" value={itemForm.maxQty} onChange={(e) => setItemForm({ ...itemForm, maxQty: Number(e.target.value) })} className="input-field" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">إضافة</button>
                <button type="button" onClick={() => setShowItemForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">حركة مخزنية</h2>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
                <select value={transForm.itemId} onChange={(e) => setTransForm({ ...transForm, itemId: e.target.value })} className="input-field" required>
                  <option value="">اختر صنف</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>{item.name} ({item.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                <select value={transForm.type} onChange={(e) => setTransForm({ ...transForm, type: e.target.value })} className="input-field">
                  <option value="in">إضافة</option>
                  <option value="out">صرف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input type="number" min="1" value={transForm.qty} onChange={(e) => setTransForm({ ...transForm, qty: Number(e.target.value) })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={transForm.notes} onChange={(e) => setTransForm({ ...transForm, notes: e.target.value })} className="input-field" rows="2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">تسجيل</button>
                <button type="button" onClick={() => setShowTransForm(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
