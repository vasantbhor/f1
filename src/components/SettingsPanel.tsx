import {
  DatabaseBackup,
  Download,
  Plus,
  RotateCcw,
  Sprout,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { Voucher } from '../types/farm';

interface SettingsPanelProps {
  crops: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  vouchers: Voucher[];
  onAddCrop: (crop: string) => void;
  onRemoveCrop: (crop: string) => void;
  onAddExpenseCategory: (cat: string) => void;
  onRemoveExpenseCategory: (cat: string) => void;
  onLoadSampleData: () => void;
  onClearAllVouchers: () => void;
  onRestoreBackup: (data: {
    vouchers: Voucher[];
    crops?: string[];
    expenseCategories?: string[];
    incomeCategories?: string[];
  }) => void;
}

export function SettingsPanel({
  crops,
  expenseCategories,
  incomeCategories,
  vouchers,
  onAddCrop,
  onRemoveCrop,
  onAddExpenseCategory,
  onRemoveExpenseCategory,
  onLoadSampleData,
  onClearAllVouchers,
  onRestoreBackup,
}: SettingsPanelProps) {
  const [newCrop, setNewCrop] = useState('');
  const [newCat, setNewCat] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleAddCrop = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCrop.trim();
    if (!val) return;
    onAddCrop(val);
    setNewCrop('');
    showStatus(`"${val}" हे नवीन पीक जोडले गेले.`);
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newCat.trim();
    if (!val) return;
    onAddExpenseCategory(val);
    setNewCat('');
    showStatus(`"${val}" हा नवीन खर्च प्रकार जोडला गेला.`);
  };

  const handleDownloadBackup = () => {
    const payload = {
      app: 'KrushiHisob',
      exportedAt: new Date().toISOString(),
      vouchers,
      crops,
      expenseCategories,
      incomeCategories,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `कृषी_हिशोब_बॅकअप_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('बॅकअप फाईल डाउनलोड झाली!');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.vouchers)) {
          showStatus('अवैध बॅकअप फाईल!');
          return;
        }
        onRestoreBackup(parsed);
        showStatus(`${parsed.vouchers.length} व्हाउचर यशस्वीरित्या रिस्टोअर झाले!`);
      } catch {
        showStatus('बॅकअप फाईल वाचता आली नाही.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl">
          पिके, श्रेणी व डेटा बॅकअप
        </h2>
        <p className="text-sm text-stone-500">
          नवीन पिके जोडा, खर्च प्रकार व्यवस्थापित करा आणि सुरक्षित बॅकअप ठेवा
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crop Management */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-stone-900">
            <Sprout className="h-5 w-5 text-emerald-600" />
            पिके व्यवस्थापन (Crops)
          </h3>
          <form onSubmit={handleAddCrop} className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="नवीन पिकाचे नाव (उदा. डाळिंब, द्राक्षे)"
              value={newCrop}
              onChange={(e) => setNewCrop(e.target.value)}
              className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>जोडा</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {crops.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-900"
              >
                <span>{c}</span>
                {crops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCrop(c)}
                    className="rounded p-0.5 text-emerald-700 hover:bg-emerald-200 hover:text-rose-700"
                    title="काढा"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-stone-900">
            <Tag className="h-5 w-5 text-amber-600" />
            खर्च प्रकार / श्रेणी (Categories)
          </h3>
          <form onSubmit={handleAddCat} className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="नवीन प्रकार (उदा. बियाणे, सिंचन, वीज बिल)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span>जोडा</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {expenseCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-3 py-1.5 text-sm font-bold text-stone-800"
              >
                <span>{cat}</span>
                {expenseCategories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveExpenseCategory(cat)}
                    className="rounded p-0.5 text-stone-500 hover:bg-stone-200 hover:text-rose-700"
                    title="काढा"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Backup & Demo Data */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold text-stone-900">
          <DatabaseBackup className="h-5 w-5 text-emerald-600" />
          डेटा बॅकअप व रिस्टोअर
        </h3>
        <p className="mb-4 text-xs text-stone-500">
          तुमचा सर्व डेटा तुमच्या डिव्हाइसवर सुरक्षित जतन राहतो. दुसऱ्या फोन किंवा कॉम्प्युटरवर नेण्यासाठी बॅकअप डाउनलोड करा.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800"
          >
            <Download className="h-4 w-4" />
            <span>बॅकअप डाउनलोड (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-100"
          >
            <Upload className="h-4 w-4" />
            <span>बॅकअप रिस्टोअर करा</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleUploadBackup}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              onLoadSampleData();
              showStatus('नमुना डेटा यशस्वीरित्या भरला!');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            <RotateCcw className="h-4 w-4" />
            <span>नमुना डेटा भरा</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearAllVouchers();
                  setConfirmClear(false);
                  showStatus('सर्व व्हाउचर नोंदी साफ केल्या आहेत.');
                }}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                हो, सर्व नोंदी हटवा
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-600"
              >
                रद्द
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              <span>सर्व नोंदी साफ करा</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
