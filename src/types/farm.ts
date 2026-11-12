export type PaymentMode = 'रोख' | 'उधार' | 'UPI' | 'चेक'; // Cash | Credit | UPI | Cheque
export type EntryType = 'खर्च' | 'उत्पन्न' | 'पैसे दिले' | 'पैसे घेतले'; // Expense | Income | Party Paid | Party Received
export type SettlementType = 'पेमेंट' | 'जमा'; // Payment | Received

export interface VoucherItem {
  id: string;
  srNo: number;
  particular: string; // तपशील
  category: string;   // प्रकार (खत, ट्रॅक्टर, कीटकनाशक, मजुरी, उधारी परतफेड, इ.)
  qty: string;        // नग / प्रमाण (kept as string in form for easy typing, parsed numerically)
  rate: string;       // दर
  amount: number;     // रक्कम
}

export interface Voucher {
  id: string;
  voucherNo: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  paymentRef?: string; // चेक क्र. / UPI संदर्भ / बँक तपशील
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
  paymentRef: string;
  entryType: EntryType;
  settlementType: SettlementType;
  partyName: string;
  crop: string;
  items: VoucherItem[];
  notes: string;
}

export interface VoucherPrefill {
  partyName: string;
  entryType: EntryType;
  paymentMode?: PaymentMode;
  suggestedAmount?: number;
  particular?: string;
  category?: string;
}

export interface CropSummary {
  crop: string;
  totalExpense: number;
  totalIncome: number;
  profitLoss: number;
  voucherCount: number;
  categoryExpenses: Record<string, number>;
}

export interface PartyLedgerSummary {
  partyName: string;
  creditExpense: number; // उधार घेतलेला माल / सेवा
  creditIncome: number;  // उधार विकलेला माल
  paidOut: number;       // पार्टी / मजुराला दिलेले पैसे ('पैसे दिले')
  receivedIn: number;    // पार्टी / मजुराकडून घेतलेले पैसे ('पैसे घेतले')
  netBalance: number;    // > 0 => देणे बाकी (Payable), < 0 => येणे बाकी (Receivable)
  lastDate: string;
  voucherCount: number;
  vouchers: Voucher[];
}

export interface CustomerLedgerRow {
  voucher: Voucher;
  balanceDelta: number;
  runningBalance: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'voucher-entry'
  | 'party-ledger'
  | 'voucher-list'
  | 'crop-report'
  | 'date-report'
  | 'settings';
