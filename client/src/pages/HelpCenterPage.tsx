import React from 'react';
import {
  HelpCircle,
  Zap,
  CheckCircle2,
  BookOpen,
  Boxes,
  ShoppingCart,
  Truck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEAEA] shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#98E66B] animate-pulse"></span>
          <span className="text-xs font-bold text-[#174D40] uppercase tracking-wider">
            Architecture & Workflow Documentation
          </span>
        </div>
        <h1 className="text-3xl font-black text-[#171717] tracking-tight">
          MULTISOLVE Automated Ecosystem
        </h1>
        <p className="text-sm text-[#929292] leading-relaxed">
          &quot;Enter data once. Everything else happens automatically.&quot; MULTISOLVE solves the problem of fragmented business applications by unifying sales, purchases, inventory, double-entry bookkeeping, and GST taxation into a single connected platform.
        </p>
      </div>

      {/* 3 Major Core Workflows */}
      <div className="space-y-4">
        {/* Workflow 1: Sales */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8DE] text-[#174D40] flex items-center justify-center font-bold">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">1. Automated Sales Invoice Pipeline</h3>
              <p className="text-xs text-[#929292]">When a sales invoice is created:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Inventory Decremented</span>
                <p className="text-[#929292] mt-0.5">Product stock levels decrease in real-time. Prevents negative stock.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Stock Movement Audit Log</span>
                <p className="text-[#929292] mt-0.5">Records previous stock, updated stock, invoice reference and timestamp.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Customer Accounts Receivable</span>
                <p className="text-[#929292] mt-0.5">Unpaid or partial balances automatically increase the customer&apos;s credit ledger.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Double-Entry Journal Entry</span>
                <p className="text-[#929292] mt-0.5">Posts balanced entries (Debit: Cash/Receivables, Credit: Revenue & Output GST).</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">GST Tax Record Generated</span>
                <p className="text-[#929292] mt-0.5">Categorizes CGST, SGST, or IGST based on supply jurisdiction for GSTR-1.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Dashboard & Reports Refresh</span>
                <p className="text-[#929292] mt-0.5">Sales targets gauge, revenue charts and KPI cards refresh automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow 2: Purchases */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">2. Inward Procurement Pipeline</h3>
              <p className="text-xs text-[#929292]">When a purchase bill is entered:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Stock Replenishment</span>
                <p className="text-[#929292] mt-0.5">Warehouse product quantities automatically increment.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Supplier Payables Updated</span>
                <p className="text-[#929292] mt-0.5">Pending dues to vendors are tracked with payment reconciliation.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Input Tax Credit (ITC) Recorded</span>
                <p className="text-[#929292] mt-0.5">GST paid on inward supplies becomes eligible ITC for GSTR-3B deduction.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F5] rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#171717]">Financial Ledger Updated</span>
                <p className="text-[#929292] mt-0.5">Debit: Cost of Goods Sold/Inventory, Credit: Accounts Payable / Bank.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
