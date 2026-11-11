import {
  CheckCircle2,
  Edit3,
  FileDown,
  FileSpreadsheet,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency, getTodayISO } from '../data/defaults';
import type {
  EntryType,
  PaymentMode,
  SettlementType,
  Voucher,
  VoucherItem,
} from '../types/farm';
import {
  exportSingleVoucherPdf,
  exportVoucherListExcel,
  exportVoucherListPdf,
} from '../utils/exportReports';
import {
  clearVoucherDraft,
  loadVoucherDraft,
  saveVoucherDraft,
} from '../utils/storage';

interface VoucherEntryFormProps {
  crops: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  existingParties: string[];
  nextVoucherNo: number;
  editingVoucher: Voucher | null;
  recentVouchers: Voucher[];
  onSaveVoucher: (voucher: Omit<Voucher, 'id' | 'createdAt' | 'updatedAt'>, editingId?: string) => void;
  onCancelEdit: () => void;
  onSelectVoucherToEdit: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => void;
  onQuickAddCrop: (cropName: string) => void;
}

function createEmptyRows(count: number, defaultCategory: string): VoucherItem[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `row-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    srNo: idx + 1,
    particular: '',
    category: defaultCategory,
    qty: '',
    rate: '',
    amount: 0,
  }));
}

export function VoucherEntryForm({
  crops,
  expenseCategories,
  incomeCategories,
  existingParties,
  nextVoucherNo,
  editingVoucher,
  recentVouchers,
  onSaveVoucher,
  onCancelEdit,
  onSelectVoucherToEdit,
  onDeleteVoucher,
  onQuickAddCrop,
}: VoucherEntryFormProps) {
  const initialDraft = useMemo(() => (editingVoucher ? null : loadVoucherDraft()), [editingVoucher]);

  const [voucherNo, setVoucherNo] = useState<number>(
    initialDraft?.voucherNo ?? nextVoucherNo
  );
  const [date, setDate] = useState<string>(initialDraft?.date || getTodayISO());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    initialDraft?.paymentMode || 'रोख'
  );
  const [entryType, setEntryType] = useState<EntryType>(
    initialDraft?.entryType || 'खर्च'
  );
  const [settlementType, setSettlementType] = useState<SettlementType>(
    initialDraft?.settlementType || 'पेमेंट'
  );
  const [partyName, setPartyName] = useState<string>(initialDraft?.partyName || '');
  const [crop, setCrop] = useState<string>(initialDraft?.crop || crops[0] || 'सोयाबीन');
  const [items, setItems] = useState<VoucherItem[]>(() =>
    initialDraft?.items?.length
      ? initialDraft.items
      : createEmptyRows(4, expenseCategories[0] || 'खत')
  );
  const [notes, setNotes] = useState<string>(initialDraft?.notes || '');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Inline quick crop add & quick edit picker
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [showEditPicker, setShowEditPicker] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingAllPdf, setExportingAllPdf] = useState(false);
  const [confirmDeleteEdit, setConfirmDeleteEdit] = useState(false);
  const [confirmDeletePickerId, setConfirmDeletePickerId] = useState<string | null>(null);

  const hasUnsavedContent =
    !editingVoucher &&
    (partyName.trim() !== '' ||
      notes.trim() !== '' ||
      items.some((it) => it.particular.trim() !== '' || (Number(it.amount) || 0) > 0));

  const availableCategories =
    entryType === 'खर्च'
      ? expenseCategories
      : [...incomeCategories, ...expenseCategories.filter((c) => !incomeCategories.includes(c))];

  // Auto-save draft whenever creating a new voucher so switching tabs/pages never loses data
  useEffect(() => {
    if (editingVoucher) return;
    saveVoucherDraft({
      voucherNo,
      date,
      paymentMode,
      entryType,
      settlementType,
      partyName,
      crop,
      items,
      notes,
    });
  }, [
    editingVoucher,
    voucherNo,
    date,
    paymentMode,
    entryType,
    settlementType,
    partyName,
    crop,
    items,
    notes,
  ]);

  useEffect(() => {
    if (editingVoucher) {
      setVoucherNo(editingVoucher.voucherNo);
      setDate(editingVoucher.date);
      setPaymentMode(editingVoucher.paymentMode);
      setEntryType(editingVoucher.entryType);
      setSettlementType(editingVoucher.settlementType);
      setPartyName(editingVoucher.partyName);
      setCrop(editingVoucher.crop);
      setNotes(editingVoucher.notes || '');

      const padded = [...editingVoucher.items];
      const defCat = editingVoucher.entryType === 'खर्च' ? expenseCategories[0] || 'खत' : incomeCategories[0] || 'पीक विक्री';
      while (padded.length < 4) {
        padded.push({
          id: `row-${Date.now()}-${padded.length}`,
          srNo: padded.length + 1,
          particular: '',
          category: defCat,
          qty: '',
          rate: '',
          amount: 0,
        });
      }
      setItems(padded.map((it, i) => ({ ...it, srNo: i + 1 })));
      setErrorMsg('');
    }
  }, [editingVoucher, expenseCategories, incomeCategories]);

  const resetForm = () => {
    clearVoucherDraft();
    onCancelEdit();
    setVoucherNo(nextVoucherNo);
    setDate(getTodayISO());
    setPaymentMode('रोख');
    setEntryType('खर्च');
    setSettlementType('पेमेंट');
    setPartyName('');
    setCrop(crops[0] || 'सोयाबीन');
    setItems(createEmptyRows(4, expenseCategories[0] || 'खत'));
    setNotes('');
    setErrorMsg('');
  };

  const restoreDraftOrBlank = () => {
    onCancelEdit();
    const draft = loadVoucherDraft();
    if (draft) {
      setVoucherNo(draft.voucherNo);
      setDate(draft.date);
      setPaymentMode(draft.paymentMode);
      setEntryType(draft.entryType);
      setSettlementType(draft.settlementType);
      setPartyName(draft.partyName);
      setCrop(draft.crop);
      setItems(draft.items);
      setNotes(draft.notes);
    } else {
      resetForm();
    }
  };

  const handleEntryTypeChange = (nextType: EntryType) => {
    setEntryType(nextType);
    setSettlementType(nextType === 'खर्च' ? 'पेमेंट' : 'जमा');
    const defaultCat =
      nextType === 'खर्च'
        ? expenseCategories[0] || 'खत'
        : incomeCategories[0] || 'पीक विक्री';
    setItems((prev) =>
      prev.map((row) =>
        !row.particular.trim() && row.amount === 0 ? { ...row, category: defaultCat } : row
      )
    );
  };

  const updateRow = (id: string, field: keyof VoucherItem, value: string | number) => {
    const defCat =
      entryType === 'खर्च'
        ? expenseCategories[0] || 'खत'
        : incomeCategories[0] || 'पीक विक्री';

    setItems((prev) => {
      const next = prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const q = parseFloat(field === 'qty' ? String(value) : updated.qty);
          const r = parseFloat(field === 'rate' ? String(value) : updated.rate);
          if (!Number.isNaN(q) && !Number.isNaN(r)) {
            updated.amount = Math.round(q * r * 100) / 100;
          } else {
            updated.amount = 0;
          }
        }
        return updated;
      });

      // Auto-add a new blank row whenever user types in the last row
      const lastRow = next[next.length - 1];
      if (
        lastRow &&
        lastRow.id === id &&
        field !== 'category' &&
        (lastRow.particular.trim() !== '' ||
          lastRow.qty !== '' ||
          lastRow.rate !== '' ||
          lastRow.amount > 0)
      ) {
        next.push({
          id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          srNo: next.length + 1,
          particular: '',
          category: defCat,
          qty: '',
          rate: '',
          amount: 0,
        });
      }

      return next;
    });
  };

  const addRow = () => {
    const defCat =
      entryType === 'खर्च'
        ? expenseCategories[0] || 'खत'
        : incomeCategories[0] || 'पीक विक्री';
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        srNo: prev.length + 1,
        particular: '',
        category: defCat,
        qty: '',
        rate: '',
        amount: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((r) => r.id !== id)
        .map((r, idx) => ({ ...r, srNo: idx + 1 }));
    });
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const filledItems = items
      .filter((it) => it.particular.trim() !== '' || (Number(it.amount) || 0) > 0)
      .map((it, idx) => ({
        ...it,
        srNo: idx + 1,
        particular: it.particular.trim() || `${it.category} खर्च`,
        amount: Number(it.amount) || 0,
      }));

    if (filledItems.length === 0) {
      setErrorMsg('कृपया किमान एक तपशील आणि रक्कम भरा.');
      return;
    }

    if (!crop.trim()) {
      setErrorMsg('कृपया पीक निवडा.');
      return;
    }

    const computedTotal = filledItems.reduce((s, it) => s + it.amount, 0);
    if (computedTotal <= 0) {
      setErrorMsg('कृपया वैध रक्कम (₹) भरा.');
      return;
    }

    onSaveVoucher(
      {
        voucherNo: Number(voucherNo) || nextVoucherNo,
        date: date || getTodayISO(),
        paymentMode,
        entryType,
        settlementType,
        partyName: partyName.trim() || 'रोख व्यवहार',
        crop: crop.trim(),
        items: filledItems,
        totalAmount: computedTotal,
        notes: notes.trim() || undefined,
      },
      editingVoucher?.id
    );

    const wasEdit = Boolean(editingVoucher);
    setSuccessMsg(
      wasEdit
        ? `व्हाउचर क्र. #${voucherNo} यशस्वीरित्या अद्ययावत (Edit) केले!`
        : `व्हाउचर क्र. #${voucherNo} यशस्वीरित्या जतन केले!`
    );
    setTimeout(() => setSuccessMsg(''), 4000);

    if (!wasEdit) {
      clearVoucherDraft();
      setVoucherNo((prev) => prev + 1);
      setPartyName('');
      setNotes('');
      setItems(
        createEmptyRows(
          4,
          entryType === 'खर्च'
            ? expenseCategories[0] || 'खत'
            : incomeCategories[0] || 'पीक विक्री'
        )
      );
    }
  };

  const handleAddNewCrop = () => {
    const trimmed = newCropName.trim();
    if (!trimmed) return;
    onQuickAddCrop(trimmed);
    setCrop(trimmed);
    setNewCropName('');
    setShowAddCrop(false);
  };

  const handleDownloadVoucherPdf = async () => {
    setExportingPdf(true);
    try {
      const filledItems = items
        .filter((it) => it.particular.trim() !== '' || (Number(it.amount) || 0) > 0)
        .map((it, idx) => ({
          ...it,
          srNo: idx + 1,
          particular: it.particular.trim() || `${it.category}`,
          amount: Number(it.amount) || 0,
        }));
      const draftVoucher: Voucher = {
        id: editingVoucher?.id || 'draft',
        voucherNo: Number(voucherNo) || nextVoucherNo,
        date: date || getTodayISO(),
        paymentMode,
        entryType,
        settlementType,
        partyName: partyName.trim() || 'रोख व्यवहार',
        crop: crop.trim() || crops[0] || 'सोयाबीन',
        items: filledItems,
        totalAmount: filledItems.reduce((s, i) => s + i.amount, 0),
        notes: notes.trim() || undefined,
        createdAt: editingVoucher?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await exportSingleVoucherPdf(draftVoucher);
      setSuccessMsg(`व्हाउचर क्र. #${draftVoucher.voucherNo} चे PDF डाउनलोड झाले!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadAllVouchersPdf = async () => {
    if (recentVouchers.length === 0) return;
    setExportingAllPdf(true);
    try {
      await exportVoucherListPdf(recentVouchers, 'सर्व नोंदवलेली व्हाउचर');
      setSuccessMsg('सर्व व्हाउचर नोंदींचा PDF अहवाल डाउनलोड झाला!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } finally {
      setExportingAllPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Top Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
              {editingVoucher ? `व्हाउचर संपादन (#${editingVoucher.voucherNo})` : 'व्हाउचर नोंदणी (Voucher Entry)'}
            </h2>
            {hasUnsavedContent && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                अपूर्ण नोंद सुरक्षित (जतन बाकी)
              </span>
            )}
          </div>
          <p className="text-sm text-stone-500">
            खत, ट्रॅक्टर, कीटकनाशक, मजुरी व पीक उत्पन्नाची सोपी नोंद
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={exportingPdf}
            onClick={handleDownloadVoucherPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span>व्हाउचर PDF</span>
          </button>

          {recentVouchers.length > 0 && (
            <>
              <button
                type="button"
                disabled={exportingAllPdf}
                onClick={handleDownloadAllVouchersPdf}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs sm:text-sm font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
              >
                {exportingAllPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>सर्व नोंदी PDF</span>
              </button>

              <button
                type="button"
                onClick={() => exportVoucherListExcel(recentVouchers)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel</span>
              </button>
            </>
          )}

          {recentVouchers.length > 0 && !editingVoucher && (
            <button
              type="button"
              onClick={() => setShowEditPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-900 transition hover:bg-amber-100"
            >
              <Edit3 className="h-4 w-4" />
              <span>मागील व्हाउचर बदला (Edit)</span>
            </button>
          )}
          {editingVoucher && (
            <button
              type="button"
              onClick={restoreDraftOrBlank}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100"
            >
              <Plus className="h-4 w-4" />
              <span>नवीन व्हाउचर भरा</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Picker to Edit Any Recent Voucher */}
      {showEditPicker && !editingVoucher && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <History className="h-4 w-4" />
              संपादित करण्यासाठी व्हाउचर निवडा:
            </span>
            <button
              type="button"
              onClick={() => setShowEditPicker(false)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              बंद करा
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentVouchers.slice(0, 6).map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs transition hover:border-amber-400 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectVoucherToEdit(v);
                    setShowEditPicker(false);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="font-bold text-stone-900">
                    #{v.voucherNo} • {v.crop}
                  </div>
                  <div className="truncate text-stone-500">
                    {v.partyName} ({v.date})
                  </div>
                </button>
                <span
                  className={`shrink-0 font-bold ${
                    v.entryType === 'खर्च' ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(v.totalAmount)}
                </span>
                {confirmDeletePickerId === v.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteVoucher(v.id);
                        setConfirmDeletePickerId(null);
                      }}
                      className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-bold text-white"
                    >
                      हटवा
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePickerId(null)}
                      className="rounded-lg border border-stone-300 px-1.5 py-1 text-[11px] text-stone-600"
                    >
                      रद्द
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePickerId(v.id)}
                    className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                    title="व्हाउचर हटवा"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Main Voucher Paper Card */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        {/* Top Voucher Header Controls (Matches User Format) */}
        <div className="border-b border-stone-200 bg-stone-50/70 p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Side: Cash/Credit & Payment/Received */}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-600">
                  व्यवहार प्रकार (रोख / उधार)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['रोख', 'उधार'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                        paymentMode === mode
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {mode === 'रोख' ? 'रोख (Cash)' : 'उधार (Credit)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-600">
                  पेमेंट / जमा स्थिती (Payment / Received)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['पेमेंट', 'जमा'] as SettlementType[]).map((sType) => (
                    <button
                      key={sType}
                      type="button"
                      onClick={() => setSettlementType(sType)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                        settlementType === sType
                          ? 'border-stone-800 bg-stone-800 text-white shadow-sm'
                          : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {sType === 'पेमेंट' ? 'पेमेंट दिले (Payment)' : 'जमा झाले (Received)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Expense/Income & Voucher No / Date */}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-stone-600">
                  नोंद प्रकार (खर्च / उत्पन्न)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('खर्च')}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      entryType === 'खर्च'
                        ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-rose-50'
                    }`}
                  >
                    खर्च (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEntryTypeChange('उत्पन्न')}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      entryType === 'उत्पन्न'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-stone-300 bg-white text-stone-700 hover:bg-emerald-50'
                    }`}
                  >
                    उत्पन्न (Income)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-600">
                    व्हाउचर क्र.
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={voucherNo}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    }}
                    onChange={(e) => setVoucherNo(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-600">दिनांक</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Party Name & Crop Row */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-stone-700">
                पार्टीचे नाव (Party Name — दुकान / व्यापारी / मजूर)
              </label>
              <input
                type="text"
                list="party-suggestions"
                placeholder="उदा. महालक्ष्मी कृषी सेवा केंद्र / रामराव पाटील"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <datalist id="party-suggestions">
                {existingParties.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">पीक निवडा (Crop)</label>
                <button
                  type="button"
                  onClick={() => setShowAddCrop((s) => !s)}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + नवीन पीक जोडा
                </button>
              </div>
              {showAddCrop ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="नवीन पिकाचे नाव..."
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    className="flex-1 rounded-xl border border-emerald-400 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCrop}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    जोडा
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCrop(false)}
                    className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600"
                  >
                    रद्द
                  </button>
                </div>
              ) : (
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-bold text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {crops.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table View (Sr.No | Particular | Category | Qty | Rate | Amount) */}
        <div className="hidden md:block overflow-x-auto p-3 sm:p-4">
          <table className="w-full border-collapse border border-stone-300 text-sm">
            <thead>
              <tr className="bg-emerald-50 text-stone-800">
                <th className="w-16 border border-stone-300 px-3 py-3 text-center font-bold">अ.क्र.</th>
                <th className="border border-stone-300 px-3 py-3 text-left font-bold">तपशील (Particular)</th>
                <th className="w-44 border border-stone-300 px-3 py-3 text-left font-bold">प्रकार (Category)</th>
                <th className="w-28 border border-stone-300 px-3 py-3 text-right font-bold">नग / प्रमाण</th>
                <th className="w-32 border border-stone-300 px-3 py-3 text-right font-bold">दर (₹)</th>
                <th className="w-36 border border-stone-300 px-3 py-3 text-right font-bold">
                  {entryType === 'खर्च' ? 'खर्च रक्कम (₹)' : 'उत्पन्न रक्कम (₹)'}
                </th>
                <th className="w-12 border border-stone-300 px-2 py-3 text-center font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70">
                  <td className="border border-stone-300 px-3 py-2 text-center font-bold text-stone-600">
                    {item.srNo}
                  </td>
                  <td className="border border-stone-300 px-2 py-2">
                    <input
                      type="text"
                      placeholder="उदा. युरिया खत, नांगरणी, फवारणी..."
                      value={item.particular}
                      onChange={(e) => updateRow(item.id, 'particular', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-stone-300 px-2 py-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateRow(item.id, 'category', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm font-medium text-stone-900 focus:border-emerald-500 focus:outline-none"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-stone-300 px-2 py-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={item.qty}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      onChange={(e) => updateRow(item.id, 'qty', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-right text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-stone-300 px-2 py-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={item.rate}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      onChange={(e) => updateRow(item.id, 'rate', e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-right text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-stone-300 px-2 py-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={item.amount || ''}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      onChange={(e) => updateRow(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-right text-sm font-bold text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </td>
                  <td className="border border-stone-300 px-2 py-2 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                        title="ओळ काढा"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View for Rows (Super easy typing on phone!) */}
        <div className="divide-y divide-stone-200 md:hidden">
          {items.map((item) => (
            <div key={item.id} className="space-y-2.5 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900">
                  अ.क्र. {item.srNo}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    काढा
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  placeholder="तपशील (उदा. युरिया खत, मजुरी)"
                  value={item.particular}
                  onChange={(e) => updateRow(item.id, 'particular', e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={item.category}
                  onChange={(e) => updateRow(item.id, 'category', e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      प्रकार: {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-0.5 block text-[11px] font-semibold text-stone-500">
                    नग / प्रमाण
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={item.qty}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    }}
                    onChange={(e) => updateRow(item.id, 'qty', e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[11px] font-semibold text-stone-500">
                    दर (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={item.rate}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    }}
                    onChange={(e) => updateRow(item.id, 'rate', e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-2.5 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[11px] font-semibold text-stone-500">
                    रक्कम (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={item.amount || ''}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    }}
                    onChange={(e) => updateRow(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-stone-400 bg-stone-50 px-2.5 py-2 text-right text-sm font-bold text-stone-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row & Notes */}
        <div className="border-t border-stone-200 bg-stone-50/50 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
              <span>अजून ओळ वाढवा</span>
            </button>

            <div className="flex items-center gap-3 text-right">
              <span className="text-sm font-bold text-stone-600">एकूण रक्कम:</span>
              <span
                className={`text-2xl font-extrabold ${
                  entryType === 'खर्च' ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder="टीप / शेरा (ऐच्छिक — उदा. उधारीची तारीख किंवा मजुरीचा तपशील)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-700 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom Footer Buttons: Delete (in edit) | Clear | PDF | Edit | Save */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 bg-white px-4 py-4 sm:px-6">
          {editingVoucher && (
            confirmDeleteEdit ? (
              <div className="mr-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteVoucher(editingVoucher.id);
                    setConfirmDeleteEdit(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>हो, हे व्हाउचर हटवा</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteEdit(false)}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700"
                >
                  रद्द
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteEdit(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                <span>व्हाउचर हटवा (Delete)</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-stone-100"
          >
            <RotateCcw className="h-4 w-4" />
            <span>साफ करा</span>
          </button>

          <button
            type="button"
            disabled={exportingPdf}
            onClick={handleDownloadVoucherPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span>व्हाउचर PDF</span>
          </button>

          {!editingVoucher && recentVouchers.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectVoucherToEdit(recentVouchers[0])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 transition hover:bg-amber-100"
            >
              <Edit3 className="h-4 w-4" />
              <span>संपादन (Edit)</span>
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            <span>{editingVoucher ? 'बदल जतन करा (Update)' : 'जतन करा (Save)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
