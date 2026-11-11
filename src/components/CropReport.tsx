import {
  FileDown,
  FileSpreadsheet,
  Loader2,
  Sprout,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency, formatDateMarathi } from '../data/defaults';
import type { CropSummary, Voucher } from '../types/farm';
import { exportCropReportExcel, exportCropReportPdf } from '../utils/exportReports';

interface CropReportProps {
  cropSummaries: CropSummary[];
  vouchers: Voucher[];
  initialCropFilter?: string;
}

export function CropReport({
  cropSummaries,
  vouchers,
  initialCropFilter = 'सर्व',
}: CropReportProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCropFilter);
  const [exportingPdf, setExportingPdf] = useState(false);

  const visibleSummaries = useMemo(() => {
    if (selectedCrop === 'सर्व') return cropSummaries;
    return cropSummaries.filter((c) => c.crop === selectedCrop);
  }, [cropSummaries, selectedCrop]);

  const filteredVouchers = useMemo(() => {
    const list =
      selectedCrop === 'सर्व'
        ? vouchers
        : vouchers.filter((v) => v.crop === selectedCrop);
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo);
  }, [vouchers, selectedCrop]);

  const totals = useMemo(() => {
    const expense = visibleSummaries.reduce((s, c) => s + c.totalExpense, 0);
    const income = visibleSummaries.reduce((s, c) => s + c.totalIncome, 0);
    return {
      expense,
      income,
      net: income - expense,
    };
  }, [visibleSummaries]);

  const handlePdfDownload = async () => {
    setExportingPdf(true);
    try {
      await exportCropReportPdf(visibleSummaries, filteredVouchers, selectedCrop);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExcelDownload = () => {
    exportCropReportExcel(visibleSummaries, filteredVouchers, selectedCrop);
  };

  return (
    <div className="space-y-5">
      {/* Header + Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            पीक निहाय सविस्तर अहवाल (नफा / तोटा)
          </h2>
          <p className="text-sm text-stone-500">
            प्रत्येक पिकाचा खत, ट्रॅक्टर, कीटकनाशक, मजुरी खर्च, उत्पन्न आणि नफा-तोटा
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={visibleSummaries.length === 0 || exportingPdf}
            onClick={handlePdfDownload}
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
            disabled={visibleSummaries.length === 0}
            onClick={handleExcelDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel डाउनलोड</span>
          </button>
        </div>
      </div>

      {/* Crop Filter & Totals */}
      <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-4 md:items-center">
        <div>
          <label className="mb-1 block text-xs font-bold text-stone-500">पीक निवडा</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="सर्व">सर्व पिके ({cropSummaries.length})</option>
            {cropSummaries.map((c) => (
              <option key={c.crop} value={c.crop}>
                {c.crop}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl bg-rose-50 px-4 py-2.5">
          <div className="text-xs font-semibold text-rose-700">एकूण खर्च</div>
          <div className="text-lg font-extrabold text-rose-700">
            {formatCurrency(totals.expense)}
          </div>
        </div>

        <div className="rounded-xl bg-emerald-50 px-4 py-2.5">
          <div className="text-xs font-semibold text-emerald-700">एकूण उत्पन्न</div>
          <div className="text-lg font-extrabold text-emerald-700">
            {formatCurrency(totals.income)}
          </div>
        </div>

        <div
          className={`rounded-xl px-4 py-2.5 ${
            totals.net >= 0 ? 'bg-emerald-100/80' : 'bg-rose-100/80'
          }`}
        >
          <div className="flex items-center gap-1 text-xs font-bold text-stone-700">
            {totals.net >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-700" />
            )}
            <span>निव्वळ {totals.net >= 0 ? 'नफा' : 'तोटा'}</span>
          </div>
          <div
            className={`text-lg font-extrabold ${
              totals.net >= 0 ? 'text-emerald-900' : 'text-rose-800'
            }`}
          >
            {formatCurrency(Math.abs(totals.net))}
          </div>
        </div>
      </div>

      {/* Crop Summary Table */}
      {visibleSummaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          निवडलेल्या पिकासाठी नोंदी उपलब्ध नाहीत.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-300 bg-stone-50 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-stone-900">
                <Sprout className="h-4 w-4 text-emerald-600" />
                पीक निहाय खर्च श्रेणी व नफा-तोटा तक्ता
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-xs text-stone-700">
                    <th className="border border-stone-300 px-4 py-3 text-left font-bold">पीक</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold">खत</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold">ट्रॅक्टर</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold">कीटकनाशक</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold">मजुरी</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold">इतर</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-700">
                      एकूण खर्च
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                      एकूण उत्पन्न
                    </th>
                    <th className="border border-stone-300 px-4 py-3 text-right font-bold">नफा / तोटा</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSummaries.map((s) => {
                    const otherExp = Object.entries(s.categoryExpenses)
                      .filter(([k]) => !['खत', 'ट्रॅक्टर', 'कीटकनाशक', 'मजुरी'].includes(k))
                      .reduce((acc, [, v]) => acc + v, 0);
                    const isProfit = s.profitLoss >= 0;
                    return (
                      <tr
                        key={s.crop}
                        onClick={() =>
                          setSelectedCrop((prev) => (prev === s.crop ? 'सर्व' : s.crop))
                        }
                        className="cursor-pointer hover:bg-emerald-50/40"
                      >
                        <td className="border border-stone-300 px-4 py-3 font-extrabold text-stone-900">
                          {s.crop}
                          <span className="ml-1.5 text-xs font-normal text-stone-400">
                            ({s.voucherCount})
                          </span>
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right text-stone-700">
                          {formatCurrency(s.categoryExpenses['खत'] || 0)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right text-stone-700">
                          {formatCurrency(s.categoryExpenses['ट्रॅक्टर'] || 0)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right text-stone-700">
                          {formatCurrency(s.categoryExpenses['कीटकनाशक'] || 0)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right text-stone-700">
                          {formatCurrency(s.categoryExpenses['मजुरी'] || 0)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right text-stone-700">
                          {formatCurrency(otherExp)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-600">
                          {formatCurrency(s.totalExpense)}
                        </td>
                        <td className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                          {formatCurrency(s.totalIncome)}
                        </td>
                        <td className="border border-stone-300 px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                              isProfit
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {formatCurrency(Math.abs(s.profitLoss))}{' '}
                            {isProfit ? 'नफा' : 'तोटा'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-extrabold">
                    <td
                      colSpan={6}
                      className="border border-stone-300 px-4 py-3 text-right text-stone-800"
                    >
                      एकूण बेरीज:
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-rose-700">
                      {formatCurrency(totals.expense)}
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-emerald-700">
                      {formatCurrency(totals.income)}
                    </td>
                    <td
                      className={`border border-stone-300 px-4 py-3 text-right whitespace-nowrap ${
                        totals.net >= 0 ? 'text-emerald-800' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(Math.abs(totals.net))} {totals.net >= 0 ? 'नफा' : 'तोटा'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Itemized Ledger for Selected Crop(s) with Separate Expense & Income Columns */}
          <div className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div className="border-b border-stone-300 bg-stone-50 px-5 py-3">
              <h3 className="text-sm font-extrabold text-stone-900">
                सविस्तर पीक खातेवही ({selectedCrop === 'सर्व' ? 'सर्व पिके' : selectedCrop}) —{' '}
                {filteredVouchers.length} व्हाउचर
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-xs text-stone-700">
                    <th className="border border-stone-300 px-4 py-2.5 text-left font-bold">क्र.</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">दिनांक</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">पीक</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">पार्टीचे नाव</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">तपशील व प्रकार</th>
                    <th className="border border-stone-300 px-3 py-2.5 text-left font-bold">व्यवहार</th>
                    <th className="border border-stone-300 px-4 py-2.5 text-right font-bold text-rose-700">
                      खर्च (₹)
                    </th>
                    <th className="border border-stone-300 px-4 py-2.5 text-right font-bold text-emerald-700">
                      उत्पन्न (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((v) => {
                    const isExp = v.entryType === 'खर्च';
                    return (
                      <tr key={v.id} className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-2.5 font-bold text-stone-700">
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
                        <td className="border border-stone-300 px-4 py-2.5 text-right font-extrabold whitespace-nowrap text-rose-600">
                          {isExp ? formatCurrency(v.totalAmount) : '-'}
                        </td>
                        <td className="border border-stone-300 px-4 py-2.5 text-right font-extrabold whitespace-nowrap text-emerald-700">
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
                      className="border border-stone-300 px-4 py-3 text-right text-stone-800"
                    >
                      एकूण बेरीज:
                    </td>
                    <td className="border border-stone-300 px-4 py-3 text-right text-rose-700 whitespace-nowrap">
                      {formatCurrency(totals.expense)}
                    </td>
                    <td className="border border-stone-300 px-4 py-3 text-right text-emerald-700 whitespace-nowrap">
                      {formatCurrency(totals.income)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
