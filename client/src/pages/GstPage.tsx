import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { TaxRecord } from '../types';

export const GstPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [summary, setSummary] = useState<any>(null);
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTaxData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await apiRequest<{ summary: any; records: TaxRecord[] }>('/tax/summary');
      setSummary(res.summary);
      setRecords(res.records);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxData();
  }, [activeBusiness]);

  const exportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Type,Reference,Party Name,Party GSTIN,Taxable Amount,CGST,SGST,IGST,Total Tax\n';
    records.forEach((r) => {
      csvContent += `${r.date.split('T')[0]},${r.referenceType},${r.referenceId},"${r.partyName || ''}",${r.partyGstin || ''},${r.taxableAmount},${r.cgstAmount},${r.sgstAmount},${r.igstAmount},${r.totalTax}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_Summary_${activeBusiness?.name || 'Business'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">GST & Tax Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8DE] text-[#174D40]">
              GSTIN: {activeBusiness?.gstin || '27AABCM8812E1ZK'}
            </span>
          </div>
          <p className="text-xs text-[#929292] mt-1">
            Intra-state (CGST+SGST) and Inter-state (IGST) input and output calculations.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download size={15} className="text-[#98E66B]" />
          <span>Export GST Summary (CSV)</span>
        </button>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex items-start gap-3">
        <ShieldCheck size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <span className="font-bold">Official Filing Readiness:</span> MULTISOLVE accurately aggregates all intra-state and inter-state GST transaction registers from your sales and purchases to prepare GSTR-1 and GSTR-3B audit statements for your Chartered Accountant.
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Output GST */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#929292] font-semibold uppercase">Output GST (Sales)</span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#F87171] font-bold text-[10px]">
              Liability
            </span>
          </div>
          <div className="text-2xl font-black text-[#171717]">
            ₹{summary?.output?.total?.toLocaleString('en-IN') || 0}
          </div>
          <div className="space-y-1 pt-2 border-t border-[#EAEAEA] text-xs text-[#929292]">
            <div className="flex justify-between">
              <span>CGST (9%):</span>
              <span className="font-semibold text-[#171717]">₹{summary?.output?.cgst?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (9%):</span>
              <span className="font-semibold text-[#171717]">₹{summary?.output?.sgst?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>IGST (18%):</span>
              <span className="font-semibold text-[#171717]">₹{summary?.output?.igst?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>

        {/* Input Tax Credit (ITC) */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#929292] font-semibold uppercase">Input Tax Credit (Purchases)</span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F8DE] text-[#174D40] font-bold text-[10px]">
              Eligible ITC
            </span>
          </div>
          <div className="text-2xl font-black text-[#174D40]">
            ₹{summary?.input?.total?.toLocaleString('en-IN') || 0}
          </div>
          <div className="space-y-1 pt-2 border-t border-[#EAEAEA] text-xs text-[#929292]">
            <div className="flex justify-between">
              <span>Input CGST:</span>
              <span className="font-semibold text-[#171717]">₹{summary?.input?.cgst?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Input SGST:</span>
              <span className="font-semibold text-[#171717]">₹{summary?.input?.sgst?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Input IGST:</span>
              <span className="font-semibold text-[#171717]">₹{summary?.input?.igst?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>

        {/* Net GST Payable */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#929292] font-semibold uppercase">Net GST Payable (GSTR-3B)</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
              Net Tax Dues
            </span>
          </div>
          <div className="text-2xl font-black text-[#171717]">
            ₹{summary?.netGstPayable?.toLocaleString('en-IN') || 0}
          </div>
          <div className="space-y-1 pt-2 border-t border-[#EAEAEA] text-xs text-[#929292]">
            <div className="flex justify-between">
              <span>Total Output Tax:</span>
              <span className="font-semibold text-[#171717]">₹{summary?.output?.total?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Less Eligible ITC:</span>
              <span className="font-semibold text-[#174D40]">-₹{summary?.input?.total?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between font-bold text-[#171717] pt-1 border-t border-[#EAEAEA]">
              <span>Challan Due:</span>
              <span className="text-[#174D40]">₹{summary?.netGstPayable?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Transaction Register */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-[#171717]">Tax Transaction Register</h3>
          <p className="text-xs text-[#929292]">Every taxable supply and purchase recorded in MULTISOLVE</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Document Ref</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Party Name & GSTIN</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Taxable (₹)</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">CGST</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">SGST</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">IGST</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Total GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="py-3 text-[#929292]">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.referenceType === 'SALE'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {r.referenceType}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-[#171717]">{r.referenceId}</td>
                  <td className="py-3">
                    <div className="font-semibold text-[#171717]">{r.partyName || '—'}</div>
                    <div className="font-mono text-[10px] text-[#929292]">{r.partyGstin || 'Unregistered'}</div>
                  </td>
                  <td className="py-3 text-right font-semibold text-[#171717]">
                    ₹{r.taxableAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 text-right text-[#929292]">₹{r.cgstAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-[#929292]">₹{r.sgstAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-[#929292]">₹{r.igstAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right font-black text-[#174D40]">
                    ₹{r.totalTax.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
