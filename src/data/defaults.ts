import type { EntryType, PaymentMode, Voucher } from '../types/farm';

export const GENERAL_PARTY_CROP = 'सामान्य / पार्टी खाते';

export const DEFAULT_CROPS: string[] = [
  'सोयाबीन',
  'कापूस',
  'तूर',
  'ऊस',
  'गहू',
  'हरभरा',
  'कांदा',
  'मका',
  'ज्वारी',
  'भात',
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'खत',
  'ट्रॅक्टर',
  'कीटकनाशक',
  'मजुरी',
  'इतर',
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  'पीक विक्री',
  'शासकीय अनुदान',
  'इतर उत्पन्न',
];

export const DEFAULT_PARTY_PAYMENT_CATEGORIES: string[] = [
  'उधारी परतफेड',
  'मजूर उचल (Advance)',
  'मजुरी देणे',
  'उसने दिले / परत',
  'इतर',
];

export const DEFAULT_PARTY_RECEIPT_CATEGORIES: string[] = [
  'उधारी वसुली',
  'उसने घेतले',
  'उचल परत',
  'अ‍ॅडव्हान्स जमा',
  'इतर',
];

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  रोख: 'रोख (Cash)',
  उधार: 'उधार (Credit)',
  UPI: 'UPI (ऑनलाइन)',
  चेक: 'चेक (Cheque)',
};

export function getPaymentModeLabel(mode: PaymentMode): string {
  return PAYMENT_MODE_LABELS[mode] ?? mode;
}

export interface EntryTypeMeta {
  label: string;
  shortLabel: string;
  englishLabel: string;
  badgeClass: string;
  amountClass: string;
  pdfColor: string;
  isPartyTransfer: boolean;
}

const ENTRY_TYPE_META: Record<EntryType, EntryTypeMeta> = {
  खर्च: {
    label: 'खर्च (Expense)',
    shortLabel: 'खर्च',
    englishLabel: 'Expense',
    badgeClass: 'bg-rose-100 text-rose-700',
    amountClass: 'text-rose-600',
    pdfColor: '#b91c1c',
    isPartyTransfer: false,
  },
  उत्पन्न: {
    label: 'उत्पन्न (Income)',
    shortLabel: 'उत्पन्न',
    englishLabel: 'Income',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    amountClass: 'text-emerald-700',
    pdfColor: '#15803d',
    isPartyTransfer: false,
  },
  'पैसे दिले': {
    label: 'पैसे दिले (उधारी / उचल)',
    shortLabel: 'पैसे दिले',
    englishLabel: 'Party Payment / Advance',
    badgeClass: 'bg-amber-100 text-amber-800',
    amountClass: 'text-amber-700',
    pdfColor: '#b45309',
    isPartyTransfer: true,
  },
  'पैसे घेतले': {
    label: 'पैसे घेतले (वसुली / जमा)',
    shortLabel: 'पैसे घेतले',
    englishLabel: 'Party Receipt / Recovery',
    badgeClass: 'bg-sky-100 text-sky-800',
    amountClass: 'text-sky-700',
    pdfColor: '#0369a1',
    isPartyTransfer: true,
  },
};

export function getEntryTypeMeta(entryType: EntryType): EntryTypeMeta {
  return ENTRY_TYPE_META[entryType] ?? ENTRY_TYPE_META['खर्च'];
}

export const MARATHI_MONTHS: string[] = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
  }).format(safe);
}

export function formatDateMarathi(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatMonthMarathi(yyyyMm: string): string {
  const [year, monthStr] = yyyyMm.split('-');
  const monthIdx = Number(monthStr) - 1;
  const monthName = MARATHI_MONTHS[monthIdx] ?? monthStr;
  return `${monthName} ${year}`;
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getSampleVouchers(): Voucher[] {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prevMonthDate = new Date(yyyy, now.getMonth() - 1, 15);
  const pY = prevMonthDate.getFullYear();
  const pM = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

  return [
    {
      id: 'sample-1',
      voucherNo: 101,
      date: `${pY}-${pM}-05`,
      paymentMode: 'रोख',
      entryType: 'खर्च',
      settlementType: 'पेमेंट',
      partyName: 'महालक्ष्मी कृषी सेवा केंद्र',
      crop: 'सोयाबीन',
      items: [
        { id: 's1-1', srNo: 1, particular: 'युरिया खत (५० किलो)', category: 'खत', qty: '4', rate: '270', amount: 1080 },
        { id: 's1-2', srNo: 2, particular: 'डी.ए.पी. खत (५० किलो)', category: 'खत', qty: '3', rate: '1350', amount: 4050 },
        { id: 's1-3', srNo: 3, particular: 'अळी नाशक औषध (१ लि.)', category: 'कीटकनाशक', qty: '2', rate: '850', amount: 1700 },
      ],
      totalAmount: 6830,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      voucherNo: 102,
      date: `${pY}-${pM}-12`,
      paymentMode: 'उधार',
      entryType: 'खर्च',
      settlementType: 'पेमेंट',
      partyName: 'रामराव पाटील (ट्रॅक्टर)',
      crop: 'सोयाबीन',
      items: [
        { id: 's2-1', srNo: 1, particular: 'रोटर व पेरणी ट्रॅक्टर भाडे (एकर)', category: 'ट्रॅक्टर', qty: '4', rate: '1200', amount: 4800 },
        { id: 's2-2', srNo: 2, particular: 'निंदणी मजुरी (दिवस)', category: 'मजुरी', qty: '8', rate: '350', amount: 2800 },
      ],
      totalAmount: 7600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      voucherNo: 103,
      date: `${yyyy}-${mm}-02`,
      paymentMode: 'रोख',
      entryType: 'उत्पन्न',
      settlementType: 'जमा',
      partyName: 'कृषी उत्पन्न बाजार समिती (अडत)',
      crop: 'सोयाबीन',
      items: [
        { id: 's3-1', srNo: 1, particular: 'सोयाबीन विक्री (क्विंटल)', category: 'पीक विक्री', qty: '12', rate: '4650', amount: 55800 },
      ],
      totalAmount: 55800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-4',
      voucherNo: 104,
      date: `${yyyy}-${mm}-04`,
      paymentMode: 'रोख',
      entryType: 'खर्च',
      settlementType: 'पेमेंट',
      partyName: 'किसान अ‍ॅग्रो एजन्सी',
      crop: 'कापूस',
      items: [
        { id: 's4-1', srNo: 1, particular: 'पालापाचोळा / खत १०:२६:२६', category: 'खत', qty: '5', rate: '1470', amount: 7350 },
        { id: 's4-2', srNo: 2, particular: 'फवारणी कीटकनाशक', category: 'कीटकनाशक', qty: '3', rate: '950', amount: 2850 },
        { id: 's4-3', srNo: 3, particular: 'कापूस वेचणी मजुरी', category: 'मजुरी', qty: '10', rate: '400', amount: 4000 },
        { id: 's4-4', srNo: 4, particular: 'वाहतूक व हमाली', category: 'इतर', qty: '1', rate: '1200', amount: 1200 },
      ],
      totalAmount: 15400,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-5',
      voucherNo: 105,
      date: `${yyyy}-${mm}-08`,
      paymentMode: 'रोख',
      entryType: 'उत्पन्न',
      settlementType: 'जमा',
      partyName: 'विदर्भ कॉटन जिनिंग मिल',
      crop: 'कापूस',
      items: [
        { id: 's5-1', srNo: 1, particular: 'कापूस विक्री (क्विंटल)', category: 'पीक विक्री', qty: '6', rate: '7200', amount: 43200 },
      ],
      totalAmount: 43200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
