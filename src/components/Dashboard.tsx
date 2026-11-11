import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
  FilePlus2,
  IndianRupee,
  Sprout,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatDateMarathi } from '../data/defaults';
import type { ActiveTab, CropSummary, Voucher } from '../types/farm';

interface DashboardProps {
  vouchers: Voucher[];
  cropSummaries: CropSummary[];
  onNavigate: (tab: ActiveTab) => void;
  onEditVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  onOpenCropReport: (crop: string) => void;
}

const CORE_CATEGORIES = ['खत', 'ट्रॅक्टर', 'कीटकनाशक', 'मजुरी', 'इतर'];

export function Dashboard({
  vouchers,
  cropSummaries,
  onNavigate,
  onEditVoucher,
  onDeleteVoucher,
  onOpenCropReport,
}: DashboardProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const totalExpense = vouchers
    .filter((v) => v.entryType === 'खर्च')
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const totalIncome = vouchers
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((sum, v) => sum + v.totalAmount, 0);
  const netProfit = totalIncome - totalExpense;

  const creditExpense = vouchers
    .filter((v) => v.entryType === 'खर्च' && v.paymentMode === 'उधार')
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const categoryTotals: Record<string, number> = {};
  for (const v of vouchers) {
    if (v.entryType !== 'खर्च') continue;
    for (const item of v.items) {
      const cat = CORE_CATEGORIES.includes(item.category) ? item.category : 'इतर';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + item.amount;
    }
  }

  const recentVouchers = [...vouchers]
    .sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            शेती हिशोब — मुख्य फलक
          </h2>
          <p className="text-sm text-stone-500">
            सर्व पिकांचा खर्च, उत्पन्न आणि नफा-तोटा तात्काळ पहा
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('voucher-entry')}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FilePlus2 className="h-4 w-4" />
          <span>नवीन व्हाउचर भरा</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">एकूण शेती खर्च</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-600">
            {formatCurrency(totalExpense)}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            खत, ट्रॅक्टर, कीटकनाशक, मजुरी व इतर
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">एकूण पीक उत्पन्न</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownRight className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(totalIncome)}
          </div>
          <p className="mt-1 text-xs text-stone-500">पीक विक्री व इतर जमा रक्कम</p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            netProfit >= 0
              ? 'border-emerald-300 bg-emerald-50/70'
              : 'border-rose-300 bg-rose-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              निव्वळ {netProfit >= 0 ? 'नफा (Profit)' : 'तोटा (Loss)'}
            </span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-extrabold ${
              netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {formatCurrency(Math.abs(netProfit))}
          </div>
          <p className="mt-1 text-xs font-medium text-stone-600">
            {netProfit >= 0 ? 'उत्पन्न खर्चापेक्षा जास्त आहे' : 'खर्च उत्पन्नापेक्षा जास्त आहे'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">उधार खर्च (Credit)</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-700">
            {formatCurrency(creditExpense)}
          </div>
          <p className="mt-1 text-xs text-stone-500">
            एकूण {vouchers.length} व्हाउचर नोंदवलेले
          </p>
        </div>
      </div>

      {/* Category Breakdown + Crop P&L Cards */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Category Expense Breakdown */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-stone-900">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              प्रकार निहाय खर्च (Category Wise)
            </h3>
          </div>
          <div className="space-y-3.5">
            {CORE_CATEGORIES.map((cat) => {
              const val = categoryTotals[cat] || 0;
              const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold text-stone-700">{cat}</span>
                    <span className="font-bold text-stone-900">
                      {formatCurrency(val)}{' '}
                      <span className="text-xs font-normal text-stone-500">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crop-wise P&L Overview */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-stone-900">
              <Sprout className="h-5 w-5 text-emerald-600" />
              पीक निहाय नफा - तोटा
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('crop-report')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              सविस्तर अहवाल पहा →
            </button>
          </div>

          {cropSummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              अजून कोणतेही व्हाउचर नोंदवलेले नाही.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cropSummaries.map((c) => {
                const isProfit = c.profitLoss >= 0;
                return (
                  <button
                    key={c.crop}
                    type="button"
                    onClick={() => onOpenCropReport(c.crop)}
                    className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-left transition hover:border-emerald-400 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-stone-900">{c.crop}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isProfit
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isProfit ? 'नफा' : 'तोटा'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-stone-500">खर्च</div>
                        <div className="font-bold text-rose-600">
                          {formatCurrency(c.totalExpense)}
                        </div>
                      </div>
                      <div>
                        <div className="text-stone-500">उत्पन्न</div>
                        <div className="font-bold text-emerald-700">
                          {formatCurrency(c.totalIncome)}
                        </div>
                      </div>
                      <div>
                        <div className="text-stone-500">{isProfit ? 'नफा' : 'तोटा'}</div>
                        <div
                          className={`font-extrabold ${
                            isProfit ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {formatCurrency(Math.abs(c.profitLoss))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Vouchers */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-stone-900">अलीकडील व्हाउचर नोंदी</h3>
          <button
            type="button"
            onClick={() => onNavigate('voucher-list')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            सर्व व्हाउचर पहा →
          </button>
        </div>

        {recentVouchers.length === 0 ? (
          <p className="text-sm text-stone-500">नोंदी उपलब्ध नाहीत.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-stone-300 text-left text-sm">
              <thead>
                <tr className="bg-stone-100 text-xs text-stone-700">
                  <th className="border border-stone-300 px-3 py-2.5 font-bold">क्र.</th>
                  <th className="border border-stone-300 px-3 py-2.5 font-bold">दिनांक</th>
                  <th className="border border-stone-300 px-3 py-2.5 font-bold">पीक</th>
                  <th className="border border-stone-300 px-3 py-2.5 font-bold">पार्टी</th>
                  <th className="border border-stone-300 px-3 py-2.5 font-bold">प्रकार</th>
                  <th className="border border-stone-300 px-3 py-2.5 text-right font-bold text-rose-700">
                    खर्च (₹)
                  </th>
                  <th className="border border-stone-300 px-3 py-2.5 text-right font-bold text-emerald-700">
                    उत्पन्न (₹)
                  </th>
                  <th className="border border-stone-300 px-3 py-2.5 text-center font-bold">कृती</th>
                </tr>
              </thead>
              <tbody>
                {recentVouchers.map((v) => {
                  const isExp = v.entryType === 'खर्च';
                  return (
                    <tr key={v.id} className="hover:bg-stone-50">
                      <td className="border border-stone-300 px-3 py-2.5 font-bold text-stone-700">
                        #{v.voucherNo}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap text-stone-600">
                        {formatDateMarathi(v.date)}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 font-semibold text-stone-900">
                        {v.crop}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-stone-700">
                        {v.partyName}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                            isExp
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {v.entryType} ({v.paymentMode})
                        </span>
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold whitespace-nowrap text-rose-600">
                        {isExp ? formatCurrency(v.totalAmount) : '-'}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold whitespace-nowrap text-emerald-700">
                        {!isExp ? formatCurrency(v.totalAmount) : '-'}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditVoucher(v)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>बदला</span>
                          </button>

                          {confirmDeleteId === v.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteVoucher(v.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white"
                              >
                                हो, हटवा
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-600"
                              >
                                रद्द
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(v.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>हटवा</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
