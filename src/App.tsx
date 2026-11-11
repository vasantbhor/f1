import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Menu,
  Sprout,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CropReport } from './components/CropReport';
import { Dashboard } from './components/Dashboard';
import { DateReport } from './components/DateReport';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { VoucherEntryForm } from './components/VoucherEntryForm';
import { VoucherList } from './components/VoucherList';
import { getSampleVouchers } from './data/defaults';
import type { ActiveTab, Voucher } from './types/farm';
import {
  computeCropSummaries,
  getNextVoucherNo,
  loadInitialData,
  saveCrops,
  saveExpenseCategories,
  saveIncomeCategories,
  saveVouchers,
} from './utils/storage';

export function App() {
  const initial = useMemo(() => loadInitialData(), []);

  const [vouchers, setVouchers] = useState<Voucher[]>(initial.vouchers);
  const [crops, setCrops] = useState<string[]>(initial.crops);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(
    initial.expenseCategories
  );
  const [incomeCategories, setIncomeCategories] = useState<string[]>(
    initial.incomeCategories
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('voucher-entry');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [cropReportFilter, setCropReportFilter] = useState<string>('सर्व');
  const [toastMsg, setToastMsg] = useState<string>('');

  useEffect(() => {
    saveVouchers(vouchers);
  }, [vouchers]);

  useEffect(() => {
    saveCrops(crops);
  }, [crops]);

  useEffect(() => {
    saveExpenseCategories(expenseCategories);
  }, [expenseCategories]);

  useEffect(() => {
    saveIncomeCategories(incomeCategories);
  }, [incomeCategories]);

  const cropSummaries = useMemo(() => computeCropSummaries(vouchers), [vouchers]);
  const nextVoucherNo = useMemo(() => getNextVoucherNo(vouchers), [vouchers]);

  const existingParties = useMemo(() => {
    const set = new Set<string>();
    for (const v of vouchers) {
      if (v.partyName && v.partyName !== 'रोख व्यवहार') set.add(v.partyName);
    }
    return Array.from(set);
  }, [vouchers]);

  const totalExpense = useMemo(
    () => vouchers.filter((v) => v.entryType === 'खर्च').reduce((s, v) => s + v.totalAmount, 0),
    [vouchers]
  );
  const totalIncome = useMemo(
    () => vouchers.filter((v) => v.entryType === 'उत्पन्न').reduce((s, v) => s + v.totalAmount, 0),
    [vouchers]
  );

  const sortedRecent = useMemo(
    () => [...vouchers].sort((a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo),
    [vouchers]
  );

  const handleSaveVoucher = (
    payload: Omit<Voucher, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => {
    const now = new Date().toISOString();
    if (editingId) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? {
                ...v,
                ...payload,
                updatedAt: now,
              }
            : v
        )
      );
      setEditingVoucher(null);
      setToastMsg(`व्हाउचर क्र. #${payload.voucherNo} यशस्वीरित्या अद्ययावत (Edit) केले!`);
      setTimeout(() => setToastMsg(''), 4000);
    } else {
      const newVoucher: Voucher = {
        ...payload,
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      setVouchers((prev) => [newVoucher, ...prev]);
      setToastMsg(`व्हाउचर क्र. #${payload.voucherNo} यशस्वीरित्या जतन केले!`);
      setTimeout(() => setToastMsg(''), 4000);
    }

    if (payload.crop && !crops.includes(payload.crop)) {
      setCrops((prev) => [...prev, payload.crop]);
    }
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setActiveTab('voucher-entry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVoucher = (id: string) => {
    const target = vouchers.find((v) => v.id === id);
    setVouchers((prev) => prev.filter((v) => v.id !== id));
    if (editingVoucher?.id === id) {
      setEditingVoucher(null);
    }
    setToastMsg(
      target
        ? `व्हाउचर क्र. #${target.voucherNo} यशस्वीरित्या हटवले!`
        : 'व्हाउचर यशस्वीरित्या हटवले!'
    );
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleStartNewVoucher = () => {
    setEditingVoucher(null);
    setActiveTab('voucher-entry');
  };

  const handleQuickAddCrop = (cropName: string) => {
    if (!crops.includes(cropName)) {
      setCrops((prev) => [...prev, cropName]);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900">
      {/* Left Side Control Panel (Desktop Sidebar + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== 'crop-report') setCropReportFilter('सर्व');
          setActiveTab(tab);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        totalExpense={totalExpense}
        totalIncome={totalIncome}
        voucherCount={vouchers.length}
        onStartNewVoucher={handleStartNewVoucher}
      />

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-900/20 bg-emerald-950 px-4 py-3 text-white shadow-sm lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl bg-emerald-900 p-2 text-emerald-100 hover:bg-emerald-800"
            aria-label="नियंत्रण पॅनेल उघडा"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-amber-400" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-white">कृषी हिशोब</div>
              <div className="text-xs font-bold text-amber-300">शिंगोटे शंकर</div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleStartNewVoucher}
          className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-stone-950"
        >
          <FilePlus2 className="h-4 w-4" />
          <span>नवीन नोंद</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="pb-28 lg:pb-10 lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {toastMsg && (
            <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm">
              ✓ {toastMsg}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              vouchers={vouchers}
              cropSummaries={cropSummaries}
              onNavigate={setActiveTab}
              onEditVoucher={handleEditVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onOpenCropReport={(crop) => {
                setCropReportFilter(crop);
                setActiveTab('crop-report');
              }}
            />
          )}

          {activeTab === 'voucher-entry' && (
            <VoucherEntryForm
              key={editingVoucher ? editingVoucher.id : 'new-draft'}
              crops={crops}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              existingParties={existingParties}
              nextVoucherNo={nextVoucherNo}
              editingVoucher={editingVoucher}
              recentVouchers={sortedRecent}
              onSaveVoucher={handleSaveVoucher}
              onCancelEdit={() => setEditingVoucher(null)}
              onSelectVoucherToEdit={handleEditVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onQuickAddCrop={handleQuickAddCrop}
            />
          )}

          {activeTab === 'voucher-list' && (
            <VoucherList
              vouchers={vouchers}
              crops={crops}
              onEditVoucher={handleEditVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onNewVoucher={handleStartNewVoucher}
            />
          )}

          {activeTab === 'crop-report' && (
            <CropReport
              key={cropReportFilter}
              cropSummaries={cropSummaries}
              vouchers={vouchers}
              initialCropFilter={cropReportFilter}
            />
          )}

          {activeTab === 'date-report' && (
            <DateReport vouchers={vouchers} crops={crops} />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              crops={crops}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              vouchers={vouchers}
              onAddCrop={handleQuickAddCrop}
              onRemoveCrop={(c) => setCrops((prev) => prev.filter((item) => item !== c))}
              onAddExpenseCategory={(cat) => {
                if (!expenseCategories.includes(cat)) {
                  setExpenseCategories((prev) => [...prev, cat]);
                }
              }}
              onRemoveExpenseCategory={(cat) =>
                setExpenseCategories((prev) => prev.filter((item) => item !== cat))
              }
              onLoadSampleData={() => setVouchers(getSampleVouchers())}
              onClearAllVouchers={() => {
                setVouchers([]);
                setEditingVoucher(null);
              }}
              onRestoreBackup={(data) => {
                setVouchers(data.vouchers);
                if (data.crops && data.crops.length > 0) setCrops(data.crops);
                if (data.expenseCategories && data.expenseCategories.length > 0) {
                  setExpenseCategories(data.expenseCategories);
                }
                if (data.incomeCategories && data.incomeCategories.length > 0) {
                  setIncomeCategories(data.incomeCategories);
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Quick Nav Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden">
        {(
          [
            { id: 'dashboard', label: 'फलक', icon: LayoutDashboard },
            { id: 'voucher-entry', label: 'व्हाउचर', icon: FilePlus2 },
            { id: 'voucher-list', label: 'यादी', icon: ClipboardList },
            { id: 'crop-report', label: 'पीक नफा', icon: BarChart3 },
            { id: 'date-report', label: 'अहवाल', icon: CalendarDays },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold ${
                active ? 'text-emerald-700' : 'text-stone-500'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
