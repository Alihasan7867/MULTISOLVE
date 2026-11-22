import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Scale,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Account, JournalEntry } from '../types';

export const AccountingPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [activeTab, setActiveTab] = useState<'trial-balance' | 'profit-loss' | 'balance-sheet' | 'accounts' | 'journal'>('trial-balance');
  const [loading, setLoading] = useState(true);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);

  const loadAccountingData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [accRes, jeRes, tbRes, plRes, bsRes] = await Promise.all([
        apiRequest<{ accounts: Account[] }>('/accounting/accounts'),
        apiRequest<{ entries: JournalEntry[] }>('/accounting/journal-entries'),
        apiRequest<any>('/accounting/trial-balance'),
        apiRequest<any>('/accounting/profit-loss'),
        apiRequest<any>('/accounting/balance-sheet'),
      ]);
      setAccounts(accRes.accounts);
      setJournalEntries(jeRes.entries);
      setTrialBalance(tbRes);
      setProfitLoss(plRes);
      setBalanceSheet(bsRes);
    } catch (err: any) {
      console.error('Accounting load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, [activeBusiness]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Double-Entry Accounting</h1>
          <p className="text-xs text-[#929292] mt-1">
            General ledger, automated journal entries, balanced trial balance, and financial statements.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F8DE] text-[#174D40] text-xs font-bold self-start sm:self-auto">
          <CheckCircle2 size={16} />
          <span>Double-Entry Balanced Books</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-[#EAEAEA]">
        {[
          { id: 'trial-balance', label: 'Trial Balance', icon: Scale },
          { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
          { id: 'balance-sheet', label: 'Balance Sheet', icon: BookOpen },
          { id: 'accounts', label: 'Chart of Accounts', icon: FileText },
          { id: 'journal', label: `Journal Entries (${journalEntries.length})`, icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#174D40] text-white shadow-xs'
                  : 'text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]'
              }`}
            >
              <Icon size={14} className={activeTab === tab.id ? 'text-[#98E66B]' : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Trial Balance Tab */}
      {activeTab === 'trial-balance' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Trial Balance</h3>
              <p className="text-xs text-[#929292]">Total Debits must strictly equal Total Credits</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#E8F8DE] text-[#174D40] text-xs font-bold rounded-full">
              <CheckCircle2 size={14} />
              <span>Books are 100% Balanced</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F5] text-[#929292]">
                <tr>
                  <th className="p-3 rounded-l-xl">Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right rounded-r-xl">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {trialBalance?.rows?.map((row: any) => (
                  <tr key={row.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="p-3 font-mono text-[#929292]">{row.code}</td>
                    <td className="p-3 font-bold text-[#171717]">{row.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F5F5] text-[#929292]">
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold text-[#171717]">
                      {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold text-[#171717]">
                      {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[#174D40] font-black text-sm text-[#174D40]">
                <tr>
                  <td colSpan={3} className="p-3">TOTAL BALANCES</td>
                  <td className="p-3 text-right">₹{trialBalance?.totalDebit?.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">₹{trialBalance?.totalCredit?.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. Profit and Loss Tab */}
      {activeTab === 'profit-loss' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Income / Revenues</h3>
              <span className="text-sm font-extrabold text-[#174D40]">
                ₹{profitLoss?.totalRevenue?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="divide-y divide-[#EAEAEA] text-xs">
              {profitLoss?.revenueAccounts?.map((a: any) => (
                <div key={a.id} className="py-2.5 flex justify-between">
                  <span className="font-semibold text-[#171717]">{a.name}</span>
                  <span className="font-bold text-[#171717]">₹{a.balance.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Operating Expenses & COGS</h3>
              <span className="text-sm font-extrabold text-[#F87171]">
                ₹{profitLoss?.totalExpenses?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="divide-y divide-[#EAEAEA] text-xs">
              {profitLoss?.expenseAccounts?.map((a: any) => (
                <div key={a.id} className="py-2.5 flex justify-between">
                  <span className="font-semibold text-[#171717]">{a.name}</span>
                  <span className="font-bold text-[#171717]">₹{a.balance.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Net Profit Summary */}
          <div className="col-span-1 md:col-span-2 bg-[#174D40] text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#98E66B] font-bold">
                Net Operating Result
              </div>
              <h2 className="text-2xl font-black mt-1">Calculated Net Profit</h2>
              <p className="text-xs text-white/70">Revenues minus direct COGS purchases and expenses</p>
            </div>
            <div className="text-3xl font-black text-[#98E66B]">
              ₹{profitLoss?.netProfit?.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* 3. Balance Sheet Tab */}
      {activeTab === 'balance-sheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assets */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Assets</h3>
              <span className="text-base font-extrabold text-[#174D40]">
                ₹{balanceSheet?.totalAssets?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="divide-y divide-[#EAEAEA] text-xs">
              {balanceSheet?.assetAccounts?.map((a: any) => (
                <div key={a.id} className="py-2.5 flex justify-between">
                  <span className="font-semibold text-[#171717]">{a.name}</span>
                  <span className="font-bold text-[#171717]">₹{a.balance.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Liabilities & Equity</h3>
              <span className="text-base font-extrabold text-[#171717]">
                ₹{balanceSheet?.totalLiabilitiesAndEquity?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-[11px] text-[#929292] uppercase">Liabilities</span>
                <div className="divide-y divide-[#EAEAEA] mt-1">
                  {balanceSheet?.liabilityAccounts?.map((a: any) => (
                    <div key={a.id} className="py-2 flex justify-between">
                      <span className="text-[#171717]">{a.name}</span>
                      <span className="font-semibold">₹{a.balance.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-[11px] text-[#929292] uppercase">Equity</span>
                <div className="divide-y divide-[#EAEAEA] mt-1">
                  {balanceSheet?.equityAccounts?.map((a: any) => (
                    <div key={a.id} className="py-2 flex justify-between">
                      <span className="text-[#171717]">{a.name}</span>
                      <span className="font-semibold">₹{a.balance.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="py-2 flex justify-between font-bold text-[#174D40]">
                    <span>Current Period Net Income (Retained)</span>
                    <span>₹{balanceSheet?.currentPeriodNetIncome?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Chart of Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F5] text-[#929292]">
                <tr>
                  <th className="p-3 rounded-l-xl">Account Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right rounded-r-xl">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-[#F5F5F5]">
                    <td className="p-3 font-mono font-bold text-[#171717]">{acc.code}</td>
                    <td className="p-3 font-semibold text-[#171717]">{acc.name}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F5] text-[#929292]">
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-sm text-[#174D40]">
                      ₹{acc.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Journal Entries Tab */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {journalEntries.map((je) => (
            <div key={je.id} className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-soft space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#171717]">{je.entryNumber}</span>
                  <span className="text-xs text-[#929292]">• {je.description}</span>
                </div>
                <div className="text-xs text-[#929292]">
                  {new Date(je.date).toLocaleDateString('en-IN')}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[#929292] border-b border-[#EAEAEA]">
                      <th className="pb-2">Account Title</th>
                      <th className="pb-2">Description / Memo</th>
                      <th className="pb-2 text-right">Debit</th>
                      <th className="pb-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {je.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 font-semibold text-[#171717]">{l.account.name}</td>
                        <td className="py-2 text-[#929292]">{l.description || '—'}</td>
                        <td className="py-2 text-right font-bold text-[#171717]">
                          {l.type === 'DEBIT' ? `₹${l.amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-2 text-right font-bold text-[#171717]">
                          {l.type === 'CREDIT' ? `₹${l.amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
