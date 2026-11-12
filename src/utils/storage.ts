import {
  DEFAULT_CROPS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PARTY_PAYMENT_CATEGORIES,
  DEFAULT_PARTY_RECEIPT_CATEGORIES,
  getSampleVouchers,
} from '../data/defaults';
import type {
  CropSummary,
  CustomerLedgerRow,
  PartyLedgerSummary,
  Voucher,
  VoucherDraft,
} from '../types/farm';

const STORAGE_KEYS = {
  VOUCHERS: 'krushi_hisob_vouchers_v1',
  CROPS: 'krushi_hisob_crops_v1',
  EXPENSE_CATS: 'krushi_hisob_exp_cats_v1',
  INCOME_CATS: 'krushi_hisob_inc_cats_v1',
  PARTY_PAYMENT_CATS: 'krushi_hisob_party_pay_cats_v1',
  PARTY_RECEIPT_CATS: 'krushi_hisob_party_rec_cats_v1',
  INITIALIZED: 'krushi_hisob_init_v1',
  DRAFT: 'krushi_hisob_draft_v1',
};

export function loadInitialData(): {
  vouchers: Voucher[];
  crops: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  partyPaymentCategories: string[];
  partyReceiptCategories: string[];
} {
  try {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const rawVouchers = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
    const rawCrops = localStorage.getItem(STORAGE_KEYS.CROPS);
    const rawExpCats = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATS);
    const rawIncCats = localStorage.getItem(STORAGE_KEYS.INCOME_CATS);
    const rawPartyPayCats = localStorage.getItem(STORAGE_KEYS.PARTY_PAYMENT_CATS);
    const rawPartyRecCats = localStorage.getItem(STORAGE_KEYS.PARTY_RECEIPT_CATS);

    let vouchers: Voucher[] = [];
    if (!initialized && !rawVouchers) {
      vouchers = getSampleVouchers();
      localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else if (rawVouchers) {
      vouchers = JSON.parse(rawVouchers) as Voucher[];
    }

    const crops = rawCrops ? (JSON.parse(rawCrops) as string[]) : DEFAULT_CROPS;
    const expenseCategories = rawExpCats
      ? (JSON.parse(rawExpCats) as string[])
      : DEFAULT_EXPENSE_CATEGORIES;
    const incomeCategories = rawIncCats
      ? (JSON.parse(rawIncCats) as string[])
      : DEFAULT_INCOME_CATEGORIES;
    const partyPaymentCategories = rawPartyPayCats
      ? (JSON.parse(rawPartyPayCats) as string[])
      : DEFAULT_PARTY_PAYMENT_CATEGORIES;
    const partyReceiptCategories = rawPartyRecCats
      ? (JSON.parse(rawPartyRecCats) as string[])
      : DEFAULT_PARTY_RECEIPT_CATEGORIES;

    return {
      vouchers,
      crops,
      expenseCategories,
      incomeCategories,
      partyPaymentCategories,
      partyReceiptCategories,
    };
  } catch {
    return {
      vouchers: getSampleVouchers(),
      crops: DEFAULT_CROPS,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      partyPaymentCategories: DEFAULT_PARTY_PAYMENT_CATEGORIES,
      partyReceiptCategories: DEFAULT_PARTY_RECEIPT_CATEGORIES,
    };
  }
}

export function saveVouchers(vouchers: Voucher[]): void {
  localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function saveCrops(crops: string[]): void {
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
}

export function saveExpenseCategories(categories: string[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSE_CATS, JSON.stringify(categories));
}

export function saveIncomeCategories(categories: string[]): void {
  localStorage.setItem(STORAGE_KEYS.INCOME_CATS, JSON.stringify(categories));
}

export function savePartyPaymentCategories(categories: string[]): void {
  localStorage.setItem(STORAGE_KEYS.PARTY_PAYMENT_CATS, JSON.stringify(categories));
}

export function savePartyReceiptCategories(categories: string[]): void {
  localStorage.setItem(STORAGE_KEYS.PARTY_RECEIPT_CATS, JSON.stringify(categories));
}

export function loadVoucherDraft(): VoucherDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as VoucherDraft;
  } catch {
    return null;
  }
}

export function saveVoucherDraft(draft: VoucherDraft): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  } catch {
    // ignore storage quota errors
  }
}

export function clearVoucherDraft(): void {
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
}

export function getNextVoucherNo(vouchers: Voucher[]): number {
  if (vouchers.length === 0) return 101;
  const maxNo = vouchers.reduce((max, v) => (v.voucherNo > max ? v.voucherNo : max), 100);
  return maxNo + 1;
}

export function computeCropSummaries(vouchers: Voucher[]): CropSummary[] {
  const map = new Map<string, CropSummary>();

  for (const v of vouchers) {
    // Party payments/receipts settle balances or advances rather than creating crop P&L
    if (v.entryType !== 'खर्च' && v.entryType !== 'उत्पन्न') continue;

    const cropName = v.crop?.trim() || 'इतर / सर्वसाधारण';
    if (!map.has(cropName)) {
      map.set(cropName, {
        crop: cropName,
        totalExpense: 0,
        totalIncome: 0,
        profitLoss: 0,
        voucherCount: 0,
        categoryExpenses: {},
      });
    }
    const summary = map.get(cropName)!;
    summary.voucherCount += 1;

    if (v.entryType === 'खर्च') {
      summary.totalExpense += v.totalAmount;
      for (const item of v.items) {
        const cat = item.category || 'इतर';
        summary.categoryExpenses[cat] = (summary.categoryExpenses[cat] || 0) + item.amount;
      }
    } else if (v.entryType === 'उत्पन्न') {
      summary.totalIncome += v.totalAmount;
    }
    summary.profitLoss = summary.totalIncome - summary.totalExpense;
  }

  return Array.from(map.values()).sort((a, b) => b.totalExpense + b.totalIncome - (a.totalExpense + a.totalIncome));
}

export function computePartyLedger(vouchers: Voucher[]): PartyLedgerSummary[] {
  const map = new Map<string, PartyLedgerSummary>();

  for (const v of vouchers) {
    const rawParty = v.partyName?.trim();
    if (!rawParty || rawParty === 'रोख व्यवहार') continue;

    const isCreditPurchase = v.entryType === 'खर्च' && v.paymentMode === 'उधार';
    const isCreditSale = v.entryType === 'उत्पन्न' && v.paymentMode === 'उधार';
    const isPaidOut = v.entryType === 'पैसे दिले';
    const isReceivedIn = v.entryType === 'पैसे घेतले';

    if (!map.has(rawParty)) {
      map.set(rawParty, {
        partyName: rawParty,
        creditExpense: 0,
        creditIncome: 0,
        paidOut: 0,
        receivedIn: 0,
        netBalance: 0,
        lastDate: v.date,
        voucherCount: 0,
        vouchers: [],
      });
    }

    const entry = map.get(rawParty)!;
    entry.voucherCount += 1;
    entry.vouchers.push(v);
    if (v.date > entry.lastDate) entry.lastDate = v.date;

    if (isCreditPurchase) entry.creditExpense += v.totalAmount;
    if (isCreditSale) entry.creditIncome += v.totalAmount;
    if (isPaidOut) entry.paidOut += v.totalAmount;
    if (isReceivedIn) entry.receivedIn += v.totalAmount;

    entry.netBalance =
      entry.creditExpense + entry.receivedIn - (entry.creditIncome + entry.paidOut);
  }

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      vouchers: [...entry.vouchers].sort(
        (a, b) => b.date.localeCompare(a.date) || b.voucherNo - a.voucherNo
      ),
    }))
    .sort((a, b) => {
      const aOpen = a.netBalance !== 0 ? 1 : 0;
      const bOpen = b.netBalance !== 0 ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      if (Math.abs(b.netBalance) !== Math.abs(a.netBalance)) {
        return Math.abs(b.netBalance) - Math.abs(a.netBalance);
      }
      return b.lastDate.localeCompare(a.lastDate);
    });
}

export function buildCustomerLedgerRows(vouchers: Voucher[]): CustomerLedgerRow[] {
  const chronological = [...vouchers].sort(
    (a, b) => a.date.localeCompare(b.date) || a.voucherNo - b.voucherNo
  );

  let runningBalance = 0;
  return chronological.map((voucher) => {
    let balanceDelta = 0;
    if (voucher.entryType === 'खर्च' && voucher.paymentMode === 'उधार') {
      balanceDelta = voucher.totalAmount;
    } else if (voucher.entryType === 'पैसे घेतले') {
      balanceDelta = voucher.totalAmount;
    } else if (voucher.entryType === 'उत्पन्न' && voucher.paymentMode === 'उधार') {
      balanceDelta = -voucher.totalAmount;
    } else if (voucher.entryType === 'पैसे दिले') {
      balanceDelta = -voucher.totalAmount;
    }

    runningBalance += balanceDelta;
    return {
      voucher,
      balanceDelta,
      runningBalance,
    };
  });
}

export interface DaySummaryRow {
  date: string;
  voucherCount: number;
  expense: number;
  income: number;
  net: number;
  vouchers: Voucher[];
}

export function computeDayWiseSummaries(vouchers: Voucher[]): DaySummaryRow[] {
  const map = new Map<string, DaySummaryRow>();
  for (const v of vouchers) {
    if (!map.has(v.date)) {
      map.set(v.date, {
        date: v.date,
        voucherCount: 0,
        expense: 0,
        income: 0,
        net: 0,
        vouchers: [],
      });
    }
    const row = map.get(v.date)!;
    row.voucherCount += 1;
    row.vouchers.push(v);
    if (v.entryType === 'खर्च') {
      row.expense += v.totalAmount;
    } else if (v.entryType === 'उत्पन्न') {
      row.income += v.totalAmount;
    }
    row.net = row.income - row.expense;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export interface MonthSummaryRow {
  monthKey: string; // YYYY-MM
  voucherCount: number;
  expense: number;
  income: number;
  net: number;
  vouchers: Voucher[];
}

export function computeMonthWiseSummaries(vouchers: Voucher[]): MonthSummaryRow[] {
  const map = new Map<string, MonthSummaryRow>();
  for (const v of vouchers) {
    const monthKey = v.date ? v.date.slice(0, 7) : 'अज्ञात';
    if (!map.has(monthKey)) {
      map.set(monthKey, {
        monthKey,
        voucherCount: 0,
        expense: 0,
        income: 0,
        net: 0,
        vouchers: [],
      });
    }
    const row = map.get(monthKey)!;
    row.voucherCount += 1;
    row.vouchers.push(v);
    if (v.entryType === 'खर्च') {
      row.expense += v.totalAmount;
    } else if (v.entryType === 'उत्पन्न') {
      row.income += v.totalAmount;
    }
    row.net = row.income - row.expense;
  }
  return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
