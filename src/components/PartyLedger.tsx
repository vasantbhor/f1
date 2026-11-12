import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Edit3,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Search,
  Users,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatCurrency,
  formatDateMarathi,
  getEntryTypeMeta,
  getPaymentModeLabel,
} from '../data/defaults';
import type { PartyLedgerSummary, Voucher, VoucherPrefill } from '../types/farm';
import {
  exportCustomerLedgerExcel,
  exportCustomerLedgerPdf,
  exportSingleVoucherPdf,
} from '../utils/exportReports';
import { buildCustomerLedgerRows } from '../utils/storage';

interface PartyLedgerProps {
  partyLedger: PartyLedgerSummary[];
  selectedPartyName: string | null;
  onSelectParty: (partyName: string | null) => void;
  onQuickPartyVoucher: (prefill: VoucherPrefill) => void;
  onEditVoucher: (voucher: Voucher) => void;
}

type BalanceFilter = 'सर्व' | 'देणे' | 'येणे' | 'पूर्ण';

export function PartyLedger({
  partyLedger,
  selectedPartyName,
  onSelectParty,
  onQuickPartyVoucher,
  onEditVoucher,
}: PartyLedgerProps) {
  const [searchText, setSearchText] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('सर्व');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingVoucherId, setExportingVoucherId] = useState<string | null>(null);

  const selectedParty = useMemo(
    () =>
      selectedPartyName
        ? partyLedger.find((p) => p.partyName === selectedPartyName) ?? null
        : null,
    [partyLedger, selectedPartyName]
  );

  const ledgerRows = useMemo(() => {
    if (!selectedParty) return [];
    // Compute running balance chronologically, then show newest entry first
    return buildCustomerLedgerRows(selectedParty.vouchers).reverse();
  }, [selectedParty]);

  const totalPayable = useMemo(
    () => partyLedger.filter((p) => p.netBalance > 0).reduce((s, p) => s + p.netBalance, 0),
    [partyLedger]
  );

  const totalReceivable = useMemo(
    () =>
      partyLedger
        .filter((p) => p.netBalance < 0)
        .reduce((s, p) => s + Math.abs(p.netBalance), 0),
    [partyLedger]
  );

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return partyLedger.filter((p) => {
      if (balanceFilter === 'देणे' && p.netBalance <= 0) return false;
      if (balanceFilter === 'येणे' && p.netBalance >= 0) return false;
      if (balanceFilter === 'पूर्ण' && p.netBalance !== 0) return false;
      if (q && !p.partyName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [partyLedger, searchText, balanceFilter]);

  const handleCustomerPdf = async () => {
    if (!selectedParty) return;
    setExportingPdf(true);
    try {
      await exportCustomerLedgerPdf(selectedParty, [...ledgerRows].reverse());
    } finally {
      setExportingPdf(false);
    }
  };

  const handleCustomerExcel = () => {
    if (!selectedParty) return;
    exportCustomerLedgerExcel(selectedParty, [...ledgerRows].reverse());
  };

  const handleSingleVoucherPdf = async (v: Voucher) => {
    setExportingVoucherId(v.id);
    try {
      await exportSingleVoucherPdf(v);
    } finally {
      setExportingVoucherId(null);
    }
  };

  // Detailed Single Customer Ledger View
  if (selectedParty) {
    const isPayable = selectedParty.netBalance > 0;
    const isReceivable = selectedParty.netBalance < 0;
    const totalPurchasesAll = selectedParty.vouchers
      .filter((v) => v.entryType === 'खर्च')
      .reduce((s, v) => s + v.totalAmount, 0);
    const totalSalesAll = selectedParty.vouchers
      .filter((v) => v.entryType === 'उत्पन्न')
      .reduce((s, v) => s + v.totalAmount, 0);

    return (
      <div className="space-y-5">
        {/* Top Bar with Back, Customer Switcher & Exports */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSelectParty(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>सर्व ग्राहक</span>
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
                  {selectedParty.partyName}
                </h2>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                    isPayable
                      ? 'bg-rose-100 text-rose-700'
                      : isReceivable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {isPayable
                    ? `देणे बाकी: ${formatCurrency(selectedParty.netBalance)}`
                    : isReceivable
                      ? `येणे / उचल बाकी: ${formatCurrency(Math.abs(selectedParty.netBalance))}`
                      : 'हिशोब पूर्ण (₹0)'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                एकूण {selectedParty.voucherCount} नोंदी • शेवटचा व्यवहार:{' '}
                {formatDateMarathi(selectedParty.lastDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedParty.partyName}
              onChange={(e) => onSelectParty(e.target.value)}
              className="entry-field rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-stone-900"
              aria-label="ग्राहक बदला"
            >
              {partyLedger.map((p) => (
                <option key={p.partyName} value={p.partyName}>
                  {p.partyName}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={exportingPdf}
              onClick={handleCustomerPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span>खातेवही PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCustomerExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Summary Cards for Selected Customer */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">एकूण खरेदी / खर्च</div>
            <div className="mt-1 text-lg font-extrabold text-rose-700">
              {formatCurrency(totalPurchasesAll)}
            </div>
            <div className="text-[11px] text-stone-500">
              उधार: {formatCurrency(selectedParty.creditExpense)}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">दिलेले पैसे (परतफेड/उचल)</div>
            <div className="mt-1 text-lg font-extrabold text-amber-700">
              {formatCurrency(selectedParty.paidOut)}
            </div>
            <div className="text-[11px] text-stone-500">रोख / UPI / चेक</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">एकूण विक्री / उत्पन्न</div>
            <div className="mt-1 text-lg font-extrabold text-emerald-700">
              {formatCurrency(totalSalesAll)}
            </div>
            <div className="text-[11px] text-stone-500">
              उधार: {formatCurrency(selectedParty.creditIncome)}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-bold text-stone-500">घेतलेले पैसे (वसुली/उसने)</div>
            <div className="mt-1 text-lg font-extrabold text-sky-700">
              {formatCurrency(selectedParty.receivedIn)}
            </div>
            <div className="text-[11px] text-stone-500">रोख / UPI / चेक</div>
          </div>

          <div
            className={`col-span-2 sm:col-span-1 rounded-2xl border p-3.5 shadow-sm ${
              isPayable
                ? 'border-rose-300 bg-rose-50/70'
                : isReceivable
                  ? 'border-emerald-300 bg-emerald-50/70'
                  : 'border-stone-200 bg-stone-50'
            }`}
          >
            <div className="text-[11px] font-bold text-stone-600">सद्य निव्वळ शिल्लक</div>
            <div
              className={`mt-1 text-lg font-extrabold ${
                isPayable
                  ? 'text-rose-700'
                  : isReceivable
                    ? 'text-emerald-800'
                    : 'text-stone-800'
              }`}
            >
              {isPayable
                ? `देणे ${formatCurrency(selectedParty.netBalance)}`
                : isReceivable
                  ? `येणे ${formatCurrency(Math.abs(selectedParty.netBalance))}`
                  : '₹0 (पूर्ण)'}
            </div>
            <div className="text-[11px] text-stone-500">
              {isPayable ? 'पार्टीला देणे बाकी' : isReceivable ? 'पार्टीकडून येणे बाकी' : 'बाकी नाही'}
            </div>
          </div>
        </div>

        {/* Quick Payment / Receipt Actions */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <span className="mr-auto text-xs font-bold text-stone-600">
            {selectedParty.partyName} साठी नवीन व्यवहार नोंदवा:
          </span>
          <button
            type="button"
            onClick={() =>
              onQuickPartyVoucher({
                partyName: selectedParty.partyName,
                entryType: 'पैसे दिले',
                suggestedAmount: isPayable ? selectedParty.netBalance : undefined,
                particular: isPayable ? 'मागील उधारी परतफेड' : 'मजूर / पार्टी उचल',
                category: isPayable ? 'उधारी परतफेड' : 'मजूर उचल (Advance)',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-amber-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>पैसे दिले (परतफेड / उचल)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onQuickPartyVoucher({
                partyName: selectedParty.partyName,
                entryType: 'पैसे घेतले',
                suggestedAmount: isReceivable ? Math.abs(selectedParty.netBalance) : undefined,
                particular: isReceivable ? 'मागील येणे / उचल जमा' : 'पार्टीकडून घेतले',
                category: isReceivable ? 'उधारी वसुली' : 'उसने घेतले',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-sky-700"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>पैसे घेतले (वसुली / जमा)</span>
          </button>
        </div>

        {/* Desktop Full Detailed Ledger Table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-stone-100 text-xs text-stone-700">
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">क्र.</th>
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">दिनांक</th>
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">प्रकार</th>
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">
                    माध्यम (रोख / UPI / चेक)
                  </th>
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">पीक</th>
                  <th className="border border-stone-300 px-3 py-3 text-left font-bold">
                    संपूर्ण तपशील
                  </th>
                  <th className="border border-stone-300 px-3 py-3 text-right font-bold">
                    रक्कम (₹)
                  </th>
                  <th className="border border-stone-300 px-3 py-3 text-right font-bold">
                    चालू शिल्लक
                  </th>
                  <th className="border border-stone-300 px-3 py-3 text-center font-bold">कृती</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map(({ voucher: v, runningBalance }) => {
                  const meta = getEntryTypeMeta(v.entryType);
                  return (
                    <tr key={v.id} className="hover:bg-stone-50">
                      <td className="border border-stone-300 px-3 py-2.5 font-bold whitespace-nowrap">
                        #{v.voucherNo}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap text-stone-700">
                        {formatDateMarathi(v.date)}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                        >
                          {meta.shortLabel}
                        </span>
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-xs">
                        <div className="font-semibold text-stone-800">
                          {getPaymentModeLabel(v.paymentMode)}
                        </div>
                        {v.paymentRef && (
                          <div className="text-[11px] text-stone-500">{v.paymentRef}</div>
                        )}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 font-semibold text-stone-800 whitespace-nowrap">
                        {v.crop}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-xs text-stone-700">
                        <div className="space-y-0.5">
                          {v.items.map((it) => (
                            <div key={it.id}>
                              • <span className="font-semibold">{it.particular}</span> ({it.category})
                              {it.qty && it.rate ? ` — ${it.qty} × ₹${it.rate}` : ''} ={' '}
                              <span className="font-bold">{formatCurrency(it.amount)}</span>
                            </div>
                          ))}
                          {v.notes && (
                            <div className="text-[11px] text-stone-500">टीप: {v.notes}</div>
                          )}
                        </div>
                      </td>
                      <td
                        className={`border border-stone-300 px-3 py-2.5 text-right font-extrabold whitespace-nowrap ${meta.amountClass}`}
                      >
                        {formatCurrency(v.totalAmount)}
                      </td>
                      <td className="border border-stone-300 px-3 py-2.5 text-right text-xs font-extrabold whitespace-nowrap">
                        {runningBalance > 0 ? (
                          <span className="text-rose-700">
                            देणे {formatCurrency(runningBalance)}
                          </span>
                        ) : runningBalance < 0 ? (
                          <span className="text-emerald-700">
                            येणे {formatCurrency(Math.abs(runningBalance))}
                          </span>
                        ) : (
                          <span className="text-stone-600">₹0 (पूर्ण)</span>
                        )}
                      </td>
                      <td className="border border-stone-300 px-2.5 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={exportingVoucherId === v.id}
                            onClick={() => handleSingleVoucherPdf(v)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Detailed Cards */}
        <div className="space-y-3 md:hidden">
          {ledgerRows.map(({ voucher: v, runningBalance }) => {
            const meta = getEntryTypeMeta(v.entryType);
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-stone-900 px-2 py-0.5 text-xs font-extrabold text-white">
                        #{v.voucherNo}
                      </span>
                      <span className="text-xs font-bold text-stone-700">
                        {formatDateMarathi(v.date)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}>
                        {meta.shortLabel}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-stone-700">
                      {getPaymentModeLabel(v.paymentMode)}
                      {v.paymentRef ? ` • ${v.paymentRef}` : ''} • {v.crop}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-extrabold ${meta.amountClass}`}>
                      {formatCurrency(v.totalAmount)}
                    </div>
                    <div className="text-[11px] font-bold">
                      {runningBalance > 0 ? (
                        <span className="text-rose-700">
                          बाकी देणे: {formatCurrency(runningBalance)}
                        </span>
                      ) : runningBalance < 0 ? (
                        <span className="text-emerald-700">
                          बाकी येणे: {formatCurrency(Math.abs(runningBalance))}
                        </span>
                      ) : (
                        <span className="text-stone-600">शिल्लक: ₹0</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-stone-700">
                  {v.items.map((it) => (
                    <div key={it.id} className="flex justify-between gap-2">
                      <span>
                        • {it.particular} ({it.category})
                      </span>
                      <span className="font-bold whitespace-nowrap">
                        {formatCurrency(it.amount)}
                      </span>
                    </div>
                  ))}
                  {v.notes && <div className="text-[11px] text-stone-500">टीप: {v.notes}</div>}
                </div>

                <div className="flex justify-end gap-2 border-t border-stone-100 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSingleVoucherPdf(v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditVoucher(v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>बदला</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // All-Customers Directory View
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
            ग्राहक / पार्टी खातेवही (Customer-wise Ledger)
          </h2>
          <p className="text-sm text-stone-500">
            कोणत्याही ग्राहकाचे नाव टाकून Enter दाबा किंवा नावावर क्लिक करून संपूर्ण तपशील पहा
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onQuickPartyVoucher({
                partyName: '',
                entryType: 'पैसे दिले',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-amber-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>पैसे दिले (उधारी / उचल)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onQuickPartyVoucher({
                partyName: '',
                entryType: 'पैसे घेतले',
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-sky-700"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>पैसे घेतले (वसुली / जमा)</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">एकूण देणे बाकी (Payable)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-rose-600">
            {formatCurrency(totalPayable)}
          </div>
          <p className="mt-1 text-xs text-stone-500">दुकानदार / व्यापाऱ्यांना द्यायचे बाकी</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">
              एकूण येणे / उचल बाकी (Receivable)
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(totalReceivable)}
          </div>
          <p className="mt-1 text-xs text-stone-500">मजूर उचल व पार्टीकडून येणे बाकी</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">एकूण ग्राहक / पार्टी</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-stone-900">
            {partyLedger.length}
          </div>
          <p className="mt-1 text-xs text-stone-500">नोंदवलेले सर्व ग्राहक, व्यापारी व मजूर</p>
        </div>
      </div>

      {/* Search (Enter opens matching customer) & Filter */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ग्राहक / पार्टीचे नाव टाका (Enter दाबून तपशील उघडा)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  e.preventDefault();
                  onSelectParty(filtered[0].partyName);
                }
              }}
              className="entry-field w-full rounded-xl py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400"
            />
          </div>

          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as BalanceFilter)}
            className="entry-field w-full rounded-xl px-3 py-2 text-sm font-semibold text-stone-900"
          >
            <option value="सर्व">सर्व ग्राहक / पार्टी ({partyLedger.length})</option>
            <option value="देणे">फक्त देणे बाकी (Payable)</option>
            <option value="येणे">फक्त येणे / उचल बाकी (Receivable)</option>
            <option value="पूर्ण">हिशोब पूर्ण झालेले (₹0)</option>
          </select>
        </div>
      </div>

      {/* Party List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          <Wallet className="mx-auto mb-2 h-8 w-8 text-stone-400" />
          निवडलेल्या फिल्टरनुसार कोणताही ग्राहक / पार्टी आढळला नाही.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const isPayable = p.netBalance > 0;
            const isReceivable = p.netBalance < 0;

            return (
              <div
                key={p.partyName}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectParty(p.partyName)}
                    className="group min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-stone-900 group-hover:text-emerald-700 group-hover:underline sm:text-lg">
                        {p.partyName}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                          isPayable
                            ? 'bg-rose-100 text-rose-700'
                            : isReceivable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {isPayable
                          ? `देणे बाकी: ${formatCurrency(p.netBalance)}`
                          : isReceivable
                            ? `येणे / उचल बाकी: ${formatCurrency(Math.abs(p.netBalance))}`
                            : 'हिशोब पूर्ण (₹0)'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      एकूण {p.voucherCount} नोंदी • शेवटची नोंद: {formatDateMarathi(p.lastDate)} •{' '}
                      <span className="font-bold text-emerald-700">सर्व तपशील पहा →</span>
                    </p>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onQuickPartyVoucher({
                          partyName: p.partyName,
                          entryType: 'पैसे दिले',
                          suggestedAmount: isPayable ? p.netBalance : undefined,
                          particular: isPayable ? 'मागील उधारी परतफेड' : 'मजूर / पार्टी उचल',
                          category: isPayable ? 'उधारी परतफेड' : 'मजूर उचल (Advance)',
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>पैसे दिले</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onQuickPartyVoucher({
                          partyName: p.partyName,
                          entryType: 'पैसे घेतले',
                          suggestedAmount: isReceivable ? Math.abs(p.netBalance) : undefined,
                          particular: isReceivable ? 'मागील येणे / उचल जमा' : 'पार्टीकडून घेतले',
                          category: isReceivable ? 'उधारी वसुली' : 'उसने घेतले',
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100"
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      <span>पैसे घेतले</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectParty(p.partyName)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <span>खातेवही पहा</span>
                    </button>
                  </div>
                </div>

                {/* Mini Breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-xl bg-stone-50 px-3 py-2">
                    <div className="text-stone-500">उधार खरेदी</div>
                    <div className="font-bold text-rose-700">
                      {formatCurrency(p.creditExpense)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-stone-50 px-3 py-2">
                    <div className="text-stone-500">दिलेले पैसे (परतफेड/उचल)</div>
                    <div className="font-bold text-amber-700">{formatCurrency(p.paidOut)}</div>
                  </div>
                  <div className="rounded-xl bg-stone-50 px-3 py-2">
                    <div className="text-stone-500">उधार विक्री</div>
                    <div className="font-bold text-emerald-700">
                      {formatCurrency(p.creditIncome)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-stone-50 px-3 py-2">
                    <div className="text-stone-500">घेतलेले पैसे (वसुली/उसने)</div>
                    <div className="font-bold text-sky-700">{formatCurrency(p.receivedIn)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
