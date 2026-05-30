import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects } from '../services/api';
import { ArrowLeft, Printer } from 'lucide-react';

const categoryLabels = { materials: 'مواد', labor: 'عمالة', machinery: 'آليات', workshop: 'ورشات', transport: 'نقل', permits: 'تراخيص', other: 'أخرى' };
const categoryColors = { materials: 'text-blue-600', labor: 'text-red-600', machinery: 'text-emerald-600', workshop: 'text-purple-600', transport: 'text-amber-600', permits: 'text-orange-600', other: 'text-gray-600' };

export default function ProjectReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projects.getReport(id)
      .then(res => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>;
  if (!report) return <div className="text-center py-12 text-red-600">فشل تحميل التقرير</div>;

  const { project, budget, totalSpent, budgetRemaining, expenses, materialsUsed, totalMaterialsCost, expenseByCategory, phasesSummary, workshopsCount, machineryCount, civilEngineersCount, archEngineersCount } = report;
  const pct = budget > 0 ? ((totalSpent / budget) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(`/projects/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
          <ArrowLeft size={20} />
          <span>العودة للمشروع</span>
        </button>
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
          <Printer size={18} /> طباعة
        </button>
      </div>

      <div className="card mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">تقرير المشروع</h1>
        <p className="text-gray-600 mb-4">{project.title} - {project.location || ''}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">الحالة:</span> <span className="font-medium">{project.status}</span></div>
          <div><span className="text-gray-500">العميل:</span> <span className="font-medium">{project.clientName || '-'}</span></div>
          <div><span className="text-gray-500">تاريخ البداية:</span> <span className="font-medium">{project.startDate?.split('T')[0] || '-'}</span></div>
          <div><span className="text-gray-500">نسبة الإنجاز:</span> <span className="font-medium">{project.progress}%</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-sm text-gray-500">الميزانية</p>
          <p className="text-2xl font-bold text-blue-600">{budget.toLocaleString()} ريال</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">إجمالي المصروفات</p>
          <p className="text-2xl font-bold text-red-600">{totalSpent.toLocaleString()} ريال</p>
          <p className="text-xs text-gray-400">({pct}% من الميزانية)</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">المتبقي</p>
          <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {budgetRemaining.toLocaleString()} ريال
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-bold mb-3">الموارد البشرية</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>مهندسين مدنيين</span><span className="font-medium">{civilEngineersCount}</span></div>
            <div className="flex justify-between"><span>مهندسين معماريين</span><span className="font-medium">{archEngineersCount}</span></div>
            <div className="flex justify-between"><span>عدد الورشات</span><span className="font-medium">{workshopsCount}</span></div>
            <div className="flex justify-between"><span>الآليات والمعدات</span><span className="font-medium">{machineryCount}</span></div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold mb-3">مراحل المشروع</h3>
          <div className="space-y-2">
            {phasesSummary.length > 0 ? phasesSummary.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span>{p.progress}% - {p.cost.toLocaleString()} ريال</span>
              </div>
            )) : <p className="text-sm text-gray-400">لا توجد مراحل</p>}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-3">المصروفات حسب التصنيف</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(expenseByCategory).length > 0 ? Object.entries(expenseByCategory).map(([cat, amount]) => (
            <div key={cat} className="p-3 bg-gray-50 rounded-lg text-center">
              <p className={`font-bold text-lg ${categoryColors[cat] || 'text-gray-600'}`}>{amount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{categoryLabels[cat] || cat}</p>
            </div>
          )) : <p className="text-sm text-gray-400 col-span-4 text-center">لا توجد مصروفات</p>}
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-bold mb-3">المواد المستهلكة من المخزون</h3>
        {materialsUsed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right p-2">الصنف</th>
                  <th className="text-right p-2">الكمية</th>
                  <th className="text-right p-2">سعر الوحدة</th>
                  <th className="text-left p-2">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {materialsUsed.map((m, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{m.itemName || m.itemCode}</td>
                    <td className="p-2">{m.qty}</td>
                    <td className="p-2">{m.unitPrice} ريال</td>
                    <td className="p-2 text-left">{m.cost.toLocaleString()} ريال</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="p-2" colSpan="3">إجمالي المواد</td>
                  <td className="p-2 text-left">{totalMaterialsCost.toLocaleString()} ريال</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-4">لم يتم صرف مواد من المخزون لهذا المشروع</p>}
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold">سجل المصروفات</h3>
          <p className="text-sm font-bold text-red-600">الإجمالي: {totalSpent.toLocaleString()} ريال</p>
        </div>
        {expenses.length > 0 ? (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right p-2">التاريخ</th>
                  <th className="text-right p-2">البيان</th>
                  <th className="text-right p-2">التصنيف</th>
                  <th className="text-left p-2">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr key={exp._id || i} className="border-b">
                    <td className="p-2">{exp.date}</td>
                    <td className="p-2">{exp.description}</td>
                    <td className="p-2">{categoryLabels[exp.category] || exp.category}</td>
                    <td className="p-2 text-left font-mono">{exp.amount.toLocaleString()} ريال</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-4">لا توجد مصروفات مسجلة</p>}
      </div>
    </div>
  );
}