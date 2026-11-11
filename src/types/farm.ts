export type PaymentMode = 'रोख' | 'उधार'; // Cash | Credit
export type EntryType = 'खर्च' | 'उत्पन्न'; // Expense | Income
export type SettlementType = 'पेमेंट' | 'जमा'; // Payment | Received

export interface VoucherItem {
  id: string;
  srNo: number;
  particular: string; // तपशील
  category: string;   // प्रकार (खत, ट्रॅक्टर, कीटकनाशक, मजुरी, इतर, इ.)
  qty: string;        // नग / प्रमाण (kept as string in form for easy typing, parsed numerically)
  rate: string;       // दर
  amount: number;     // रक्कम
}

export interface Voucher {
  id: string;
  voucherNo: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  entryType: EntryType;
  settlementType: SettlementType;
  partyName: string;
  crop: string;
  items: VoucherItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherDraft {
  voucherNo: number;
  date: string;
  paymentMode: PaymentMode;
  entryType: EntryType;
  settlementType: SettlementType;
  partyName: string;
  crop: string;
  items: VoucherItem[];
  notes: string;
}

export interface CropSummary {
  crop: string;
  totalExpense: number;
  totalIncome: number;
  profitLoss: number;
  voucherCount: number;
  categoryExpenses: Record<string, number>;
}

export type ActiveTab =
  | 'dashboard'
  | 'voucher-entry'
  | 'voucher-list'
  | 'crop-report'
  | 'date-report'
  | 'settings';
