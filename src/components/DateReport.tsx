import {
  Calendar,
  CalendarRange,
  FileDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency, formatDateMarathi, formatMonthMarathi } from '../data/defaults';
import type { Voucher } from '../types/farm';
import {
  exportDateReportPdf,
  exportDayWiseExcel,
  exportMonthWiseExcel,
} from '../utils/exportReports';
import { computeDayWiseSummaries, computeMonthWiseSummaries } from '../utils/storage';

interface DateReportProps {
  vouchers: Voucher[];
  crops: string[];
}

export function DateReport({ vouchers, crops }: DateReportProps) {
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('सर्व');
  const [cropFilter, setCropFilter] = useState<string>('सर्व');
  const [exportingPdf, setExportingPdf] = useState(false);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const v of vouchers) {
      if (v.date) set.add(v.date.slice(0, 7));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (cropFilter !== 'सर्व' && v.crop !== cropFilter) return false;
      if (mode === 'day') {
        if (fromDate && v.date < fromDate) return false;
        if (toDate && v.date > toDate) return false;
      } else {
        if (selectedMonth !== 'सर्व' && !v.date.startsWith(selectedMonth)) return false;
      }
      return true;
    });
  }, [vouchers, mode, fromDate, toDate, selectedMonth, cropFilter]);

  const dayRows = useMemo(() => computeDayWiseSummaries(filteredVouchers), [filteredVouchers]);
  const monthRows = useMemo(
    () => computeMonthWiseSummaries(filteredVouchers),
    [filteredVouchers]
  );

  const totalExp = filteredVouchers
    .filter((v) => v.entryType === 'खर्च')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalInc = filteredVouchers
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((s, v) => s + v.totalAmount, 0);
  const net = totalInc - totalExp;

  const filterLabel =
    mode === 'day'
      ? `${fromDate ? formatDateMarathi(fromDate) : 'सुरुवात'} ते ${
          toDate ? formatDateMarathi(toDate) : 'आजपर्यंत'
        }${cropFilter !== 'सर्व' ? ` (${cropFilter})` : ''}`
      : `${selectedMonth === 'सर्व' ? 'सर्व महिने' : formatMonthMarathi(selectedMonth)}${
          cropFilter !== 'सर्व' ? ` (${cropFilter})` : ''
        }`;

  const handleExcel = () => {
    if (mode === 'day') {
      exportDayWiseExcel(dayRows, filteredVouchers, fromDate || 'सर्व');
    } else {
      exportMonthWiseExcel(monthRows, filteredVouchers, selectedMonth);
    }
  };

  const handlePdf = async () => {
    setExportingPdf(true);
    try {
      const pdfRows =
        mode === 'day'
          ? dayRows.map((r) => ({
              label: formatDateMarathi(r.date),
              count: r.voucherCount,
              expense: r.expense,
              income: r.income,
              net: r.net,
            }))
          : monthRows.map((r) => ({
              label: formatMonthMarathi(r.monthKey),
              count: r.voucherCount,
              expense: r.expense,
              income: r.income,
              net: r.net,
            }));
      await exportDateReportPdf(mode, pdfRows, filteredVouchers, filterLabel);
    } finally {
      setExportingPdf(false);
    }
  };

  const activeRowsCount = mode === 'day' ? dayRows.length : monthRows.length;

  return (
    <div className="space-y-5">
      {/* Header & Exports */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            दैनिक आणि मासिक अहवाल
          </h2>
          <p className="text-sm text-stone-500">
            दिवसनिहाय व महिन्यानिहाय खर्च-उत्पन्न अहवाल PDF आणि Excel मध्ये डाउनलोड करा
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={activeRowsCount === 0 || exportingPdf}
            onClick={handlePdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span>PDF डाउनलोड</span>
          </button>

          <button
            type="button"
            disabled={activeRowsCount === 0}
            onClick={handleExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel डाउनलोड</span>
          </button>
        </div>
      </div>

      {/* Mode Switch Tabs & Filters */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              mode === 'day'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>दिवसनिहाय अहवाल (Day-wise)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('month')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              mode === 'month'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <CalendarRange className="h-4 w-4" />
            <span>महिन्यानिहाय अहवाल (Month-wise)</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {mode === 'day' ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-500">
                  पासून दिनांक (From)
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-500">
                  पर्यंत दिनांक (To)
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-stone-500">महिना निवडा</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="सर्व">सर्व महिने</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthMarathi(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold text-stone-500">पीक निवडा</label>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="सर्व">सर्व पिके</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 gap-3 border-t border-stone-100 pt-3 sm:grid-cols-3">
          <div className="rounded-xl bg-rose-50 px-4 py-2.5">
            <div className="text-xs font-semibold text-rose-700">कालावधीतील खर्च</div>
            <div className="text-lg font-extrabold text-rose-700">{formatCurrency(totalExp)}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-2.5">
            <div className="text-xs font-semibold text-emerald-700">कालावधीतील उत्पन्न</div>
            <div className="text-lg font-extrabold text-emerald-700">
              {formatCurrency(totalInc)}
            </div>
          </div>
          <div
            className={`rounded-xl px-4 py-2.5 ${
              net >= 0 ? 'bg-emerald-100/80' : 'bg-rose-100/80'
            }`}
          >
            <div className="text-xs font-bold text-stone-700">
              निव्वळ {net >= 0 ? 'नफा' : 'तोटा'}
            </div>
            <div
              className={`text-lg font-extrabold ${
                net >= 0 ? 'text-emerald-900' : 'text-rose-800'
              }`}
            >
              {formatCurrency(Math.abs(net))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table & Detailed Vouchers */}
      {activeRowsCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          निवडलेल्या कालावधीत कोणतीही नोंद आढळली नाही.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-300 bg-stone-50 px-5 py-3">
              <h3 className="text-sm font-extrabold text-stone-900">
                {mode === 'day' ? 'दिवसनिहाय सारांश तक्ता' : 'महिन्यानिहाय सारांश तक्ता'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-xs text-stone-700">
                    <th className="border border-stone-300 px-4 py-3 text-left font-bold">
                      {mode === 'day' ? 'दिनांक' : 'महिना'}
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-center font-bold">
                      व्हाउचर संख्या
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-700">
                      एकूण खर्च (₹)
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                      एकूण उत्पन्न (₹)
                    </th>
                    <th className="border border-stone-300 px-4 py-3 text-right font-bold">
                      निव्वळ नफा / तोटा
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mode === 'day'
                    ? dayRows.map((r) => (
                        <tr key={r.date} className="hover:bg-stone-50">
                          <td className="border border-stone-300 px-4 py-3 font-bold text-stone-900">
                            {formatDateMarathi(r.date)}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-center font-semibold text-stone-600">
                            {r.voucherCount}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-600">
                            {formatCurrency(r.expense)}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                            {formatCurrency(r.income)}
                          </td>
                          <td className="border border-stone-300 px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                r.net >= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {formatCurrency(Math.abs(r.net))} {r.net >= 0 ? 'नफा' : 'तोटा'}
                            </span>
                          </td>
                        </tr>
                      ))
                    : monthRows.map((r) => (
                        <tr key={r.monthKey} className="hover:bg-stone-50">
                          <td className="border border-stone-300 px-4 py-3 font-bold text-stone-900">
                            {formatMonthMarathi(r.monthKey)}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-center font-semibold text-stone-600">
                            {r.voucherCount}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-600">
                            {formatCurrency(r.expense)}
                          </td>
                          <td className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                            {formatCurrency(r.income)}
                          </td>
                          <td className="border border-stone-300 px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                r.net >= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {formatCurrency(Math.abs(r.net))} {r.net >= 0 ? 'नफा' : 'तोटा'}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-extrabold">
                    <td className="border border-stone-300 px-4 py-3 text-right text-stone-800">
                      एकूण बेरीज:
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-center text-stone-800">
                      {filteredVouchers.length}
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-rose-700">
                      {formatCurrency(totalExp)}
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-emerald-700">
                      {formatCurrency(totalInc)}
                    </td>
                    <td
                      className={`border border-stone-300 px-4 py-3 text-right ${
                        net >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(Math.abs(net))} {net >= 0 ? 'नफा' : 'तोटा'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Detailed Voucher List for Selected Period (Separate Expense & Income Columns) */}
          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-300 bg-stone-50 px-5 py-3">
              <h3 className="text-sm font-extrabold text-stone-900">
                सविस्तर व्हाउचर यादी ({filteredVouchers.length} नोंदी)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-xs text-stone-700">
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">क्र.</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">दिनांक</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">पीक</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">पार्टीचे नाव</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">तपशील व प्रकार</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">व्यवहार</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-right font-bold text-rose-700">
                      खर्च (₹)
                    </th>
                    <th className="border border-stone-300 px-3 py-2.5 text-right font-bold text-emerald-700">
                      उत्पन्न (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredVouchers]
                    .sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo)
                    .map((v) => {
                      const isExp = v.entryType === 'खर्च';
                      return (
                        <tr key={v.id} className="hover:bg-stone-50">
                          <td className="border border-stone-300 px-3 py-2.5 font-bold text-stone-700">
                            #{v.voucherNo}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap text-stone-600">
                            {formatDateMarathi(v.date)}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 font-bold text-stone-900">
                            {v.crop}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 text-stone-700">
                            {v.partyName}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 text-xs text-stone-600">
                            {v.items.map((it) => `${it.particular} (${it.category})`).join(', ')}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap text-xs font-semibold text-stone-700">
                            {v.paymentMode} • {v.settlementType}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold whitespace-nowrap text-rose-600">
                            {isExp ? formatCurrency(v.totalAmount) : '-'}
                          </td>
                          <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold whitespace-nowrap text-emerald-700">
                            {!isExp ? formatCurrency(v.totalAmount) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-extrabold">
                    <td
                      colSpan={6}
                      className="border border-stone-300 px-3 py-3 text-right text-stone-800"
                    >
                      एकूण बेरीज:
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-rose-700 whitespace-nowrap">
                      {formatCurrency(totalExp)}
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-emerald-700 whitespace-nowrap">
                      {formatCurrency(totalInc)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
