import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Settings,
  Sprout,
  X,
} from 'lucide-react';
import { formatCurrency } from '../data/defaults';
import type { ActiveTab } from '../types/farm';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  totalExpense: number;
  totalIncome: number;
  voucherCount: number;
  onStartNewVoucher: () => void;
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  sublabel: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: 'dashboard',
    label: 'मुख्य फलक',
    sublabel: 'एकूण सारांश व आढावा',
    icon: LayoutDashboard,
  },
  {
    id: 'voucher-entry',
    label: 'व्हाउचर नोंदणी',
    sublabel: 'खर्च / उत्पन्न नोंदवा',
    icon: FilePlus2,
  },
  {
    id: 'voucher-list',
    label: 'व्हाउचर यादी',
    sublabel: 'शोधा व संपादित करा',
    icon: ClipboardList,
  },
  {
    id: 'crop-report',
    label: 'पीक निहाय अहवाल',
    sublabel: 'पीक खर्च, उत्पन्न व नफा-तोटा',
    icon: BarChart3,
  },
  {
    id: 'date-report',
    label: 'दैनिक व मासिक अहवाल',
    sublabel: 'दिवस व महिना निहाय PDF/Excel',
    icon: CalendarDays,
  },
  {
    id: 'settings',
    label: 'पिके व सेटिंग्ज',
    sublabel: 'पिके, श्रेणी व बॅकअप',
    icon: Settings,
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  totalExpense,
  totalIncome,
  voucherCount,
  onStartNewVoucher,
}: SidebarProps) {
  const net = totalIncome - totalExpense;

  const content = (
    <div className="flex h-full flex-col bg-emerald-950 text-emerald-50 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-emerald-800/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-950/50">
            <Sprout className="h-6 w-6 stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">कृषी हिशोब</h1>
            <p className="text-sm font-bold text-amber-300">शिंगोटे शंकर</p>
            <p className="text-[11px] text-emerald-300/80">नियंत्रण पॅनेल (Control Panel)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-900 hover:text-white lg:hidden"
          aria-label="बंद करा"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => {
            onStartNewVoucher();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-stone-950 shadow-md transition hover:bg-amber-300 active:scale-[0.98]"
        >
          <FilePlus2 className="h-5 w-5" />
          <span>+ नवीन व्हाउचर भरा</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-100/85 hover:bg-emerald-900/70 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold leading-snug">{item.label}</div>
                <div
                  className={`truncate text-[11px] ${
                    isActive ? 'text-emerald-100' : 'text-emerald-300/75'
                  }`}
                >
                  {item.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Live Farm Balance Summary Box */}
      <div className="border-t border-emerald-800/80 bg-emerald-900/50 p-4 text-xs">
        <div className="mb-2 flex items-center justify-between text-emerald-300">
          <span className="font-semibold">एकूण हिशोब स्थिती</span>
          <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
            {voucherCount} नोंदी
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-emerald-200/80">एकूण खर्च:</span>
            <span className="font-bold text-rose-300">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-200/80">एकूण उत्पन्न:</span>
            <span className="font-bold text-emerald-300">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="mt-1.5 flex justify-between border-t border-emerald-800 pt-1.5 text-sm">
            <span className="font-bold text-white">{net >= 0 ? 'निव्वळ नफा:' : 'निव्वळ तोटा:'}</span>
            <span className={`font-extrabold ${net >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(net))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Control Panel */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}
