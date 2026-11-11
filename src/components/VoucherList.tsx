import {
  Edit3,
  FileDown,
  FileSpreadsheet,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatCurrency, formatDateMarathi } from '../data/defaults';
import type { Voucher } from '../types/farm';
import {
  exportSingleVoucherPdf,
  exportVoucherListExcel,
  exportVoucherListPdf,
} from '../utils/exportReports';

interface VoucherListProps {
  vouchers: Voucher[];
  crops: string[];
  onEditVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  onNewVoucher: () => void;
}

export function VoucherList({
  vouchers,
  crops,
  onEditVoucher,
  onDeleteVoucher,
  onNewVoucher,
}: VoucherListProps) {
  const [searchText, setSearchText] = useState('');
  const [cropFilter, setCropFilter] = useState('सर्व');
  const [typeFilter, setTypeFilter] = useState<'सर्व' | 'खर्च' | 'उत्पन्न'>('सर्व');
  const [modeFilter, setModeFilter] = useState<'सर्व' | 'रोख' | 'उधार'>('सर्व');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingVoucherId, setExportingVoucherId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return [...vouchers]
      .filter((v) => {
        if (cropFilter !== 'सर्व' && v.crop !== cropFilter) return false;
        if (typeFilter !== 'सर्व' && v.entryType !== typeFilter) return false;
        if (modeFilter !== 'सर्व' && v.paymentMode !== modeFilter) return false;
        if (q) {
          const hay = [
            String(v.voucherNo),
            v.partyName,
            v.crop,
            ...v.items.map((i) => `${i.particular} ${i.category}`),
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo);
  }, [vouchers, searchText, cropFilter, typeFilter, modeFilter]);

  const totalFilteredExpense = filtered
    .filter((v) => v.entryType === 'खर्च')
    .reduce((s, v) => s + v.totalAmount, 0);
  const totalFilteredIncome = filtered
    .filter((v) => v.entryType === 'उत्पन्न')
    .reduce((s, v) => s + v.totalAmount, 0);

  const handleListPdf = async () => {
    setExportingPdf(true);
    try {
      const desc = `पीक: ${cropFilter}, प्रकार: ${typeFilter}, व्यवहार: ${modeFilter}`;
      await exportVoucherListPdf(filtered, desc);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSinglePdf = async (v: Voucher) => {
    setExportingVoucherId(v.id);
    try {
      await exportSingleVoucherPdf(v);
    } finally {
      setExportingVoucherId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            व्हाउचर यादी व संपादन
          </h2>
          <p className="text-sm text-stone-500">
            जुन्या नोंदी शोधा, संपादित करा, आणि PDF / Excel डाउनलोड करा
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={filtered.length === 0 || exportingPdf}
            onClick={handleListPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
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
            disabled={filtered.length === 0}
            onClick={() => exportVoucherListExcel(filtered)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel डाउनलोड</span>
          </button>

          <button
            type="button"
            onClick={onNewVoucher}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>नवीन व्हाउचर</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-stone-500">
          <Filter className="h-3.5 w-3.5" />
          <span>शोध व फिल्टर</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="पार्टी, तपशील, क्र. शोधा..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border border-stone-300 py-2 pr-3 pl-9 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
          >
            <option value="सर्व">सर्व पिके</option>
            {crops.map((c) => (
              <option key={c} value={c}>
                पीक: {c}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'सर्व' | 'खर्च' | 'उत्पन्न')}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
          >
            <option value="सर्व">सर्व नोंदी (खर्च व उत्पन्न)</option>
            <option value="खर्च">फक्त खर्च</option>
            <option value="उत्पन्न">फक्त उत्पन्न</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'सर्व' | 'रोख' | 'उधार')}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
          >
            <option value="सर्व">रोख व उधार दोन्ही</option>
            <option value="रोख">फक्त रोख (Cash)</option>
            <option value="उधार">फक्त उधार (Credit)</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-3 text-xs font-bold">
          <span className="text-stone-600">मिळालेल्या नोंदी: {filtered.length}</span>
          <span className="text-rose-600">एकूण खर्च: {formatCurrency(totalFilteredExpense)}</span>
          <span className="text-emerald-700">
            एकूण उत्पन्न: {formatCurrency(totalFilteredIncome)}
          </span>
        </div>
      </div>

      {/* Voucher Table (Desktop) + Cards (Mobile) */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          निवडलेल्या फिल्टरनुसार कोणतेही व्हाउचर आढळले नाही.
        </div>
      ) : (
        <>
          {/* Desktop Full-Bordered Table with Separate Expense & Income Columns */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-xs text-stone-700">
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">क्र.</th>
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">दिनांक</th>
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">पीक</th>
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">पार्टीचे नाव</th>
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">व्यवहार</th>
                    <th className="border border-stone-300 px-3 py-3 text-left font-bold">तपशील व प्रकार</th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-rose-700">
                      खर्च (₹)
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-right font-bold text-emerald-700">
                      उत्पन्न (₹)
                    </th>
                    <th className="border border-stone-300 px-3 py-3 text-center font-bold">कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const isExp = v.entryType === 'खर्च';
                    return (
                      <tr key={v.id} className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-3 py-2.5 font-bold text-stone-800 whitespace-nowrap">
                          #{v.voucherNo}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-stone-700 whitespace-nowrap">
                          {formatDateMarathi(v.date)}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 font-bold text-stone-900 whitespace-nowrap">
                          {v.crop}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-stone-800">
                          {v.partyName}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-xs whitespace-nowrap">
                          <span className="font-semibold text-stone-700">
                            {v.paymentMode} • {v.settlementType}
                          </span>
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-xs text-stone-700">
                          {v.items.map((it) => `${it.particular} (${it.category})`).join(', ')}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold text-rose-600 whitespace-nowrap">
                          {isExp ? formatCurrency(v.totalAmount) : '-'}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                          {!isExp ? formatCurrency(v.totalAmount) : '-'}
                        </td>
                        <td className="border border-stone-300 px-2.5 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={exportingVoucherId === v.id}
                              onClick={() => handleSinglePdf(v)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                              title="व्हाउचर PDF"
                            >
                              {exportingVoucherId === v.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileDown className="h-3.5 w-3.5" />
                              )}
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditVoucher(v)}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
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
                                  हटवा
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
                                title="हटवा"
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
                <tfoot>
                  <tr className="bg-stone-100 font-extrabold">
                    <td
                      colSpan={6}
                      className="border border-stone-300 px-3 py-3 text-right text-stone-800"
                    >
                      एकूण बेरीज:
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-rose-700 whitespace-nowrap">
                      {formatCurrency(totalFilteredExpense)}
                    </td>
                    <td className="border border-stone-300 px-3 py-3 text-right text-emerald-700 whitespace-nowrap">
                      {formatCurrency(totalFilteredIncome)}
                    </td>
                    <td className="border border-stone-300 px-3 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((v) => {
              const isExp = v.entryType === 'खर्च';
              return (
                <div
                  key={v.id}
                  className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-lg bg-stone-900 px-2 py-0.5 text-xs font-extrabold text-white">
                          #{v.voucherNo}
                        </span>
                        <span className="text-xs font-bold text-stone-700">
                          {formatDateMarathi(v.date)}
                        </span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                          {v.crop}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-stone-900">{v.partyName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-right text-xs">
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1">
                        <div className="text-[10px] font-semibold text-rose-700">खर्च</div>
                        <div className="font-extrabold text-rose-700">
                          {isExp ? formatCurrency(v.totalAmount) : '-'}
                        </div>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                        <div className="text-[10px] font-semibold text-emerald-700">उत्पन्न</div>
                        <div className="font-extrabold text-emerald-700">
                          {!isExp ? formatCurrency(v.totalAmount) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {v.items.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-700"
                      >
                        {item.particular} ({item.category}) — {formatCurrency(item.amount)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-stone-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() => handleSinglePdf(v)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditVoucher(v)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>बदला</span>
                    </button>
                    {confirmDeleteId === v.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteVoucher(v.id);
                            setConfirmDeleteId(null);
                          }}
                          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          हो, हटवा
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs text-stone-600"
                        >
                          रद्द
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(v.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>हटवा</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
