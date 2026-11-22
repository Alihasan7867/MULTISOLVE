import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Package,
  Truck,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';

export const ReportsPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadReports = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      let query = '';
      if (fromDate) query += `&fromDate=${fromDate}`;
      if (toDate) query += `&toDate=${toDate}`;
      const res = await apiRequest<any>(`/reports/summary?${query}`);
      setReportData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [activeBusiness]);

  const exportReport = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'MULTISOLVE Financial Performance Summary\n';
    csv += `Business,${activeBusiness?.name}\n`;
    csv += `Total Sales,${reportData?.metrics?.totalSales}\n`;
    csv += `Total Purchases,${reportData?.metrics?.totalPurchases}\n`;
    csv += `Total Expenses,${reportData?.metrics?.totalExpenses}\n`;
    csv += `Gross Profit,${reportData?.metrics?.grossProfit}\n`;
    csv += `Net Profit,${reportData?.metrics?.netProfit}\n\n`;

    csv += 'Top Customers,Amount (INR),Invoice Count\n';
    (reportData?.customerBreakdown || []).forEach((c: any) => {
      csv += `"${c.name}",${c.totalAmount},${c.count}\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MULTISOLVE_Report_${activeBusiness?.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = reportData?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Business Intelligence & Reports</h1>
          <p className="text-xs text-[#929292] mt-1">
            Audited financial calculations derived directly from transactional registers.
          </p>
        </div>

        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download size={15} className="text-[#98E66B]" />
          <span>Export Complete Summary</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-[#929292]">
            <Calendar size={15} className="text-[#174D40]" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-1.5 text-xs text-[#171717]"
          />
          <span className="text-xs text-[#929292]">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-1.5 text-xs text-[#171717]"
          />
          <button
            onClick={loadReports}
            className="px-3.5 py-1.5 bg-[#174D40] text-white rounded-xl text-xs font-semibold hover:bg-[#133E34]"
          >
            Apply
          </button>
        </div>
      </div>

      {/* 5 Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Gross Sales</div>
          <div className="text-xl font-black text-[#171717] mt-1">
            ₹{metrics?.totalSales?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Purchases / COGS</div>
          <div className="text-xl font-black text-[#171717] mt-1">
            ₹{metrics?.totalPurchases?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Gross Margin</div>
          <div className="text-xl font-black text-[#174D40] mt-1">
            ₹{metrics?.grossProfit?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Operating Expenses</div>
          <div className="text-xl font-black text-[#F87171] mt-1">
            ₹{metrics?.totalExpenses?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-4 bg-[#E8F8DE] rounded-2xl border border-[#98E66B]/30 shadow-soft">
          <div className="text-[11px] font-bold text-[#174D40] uppercase">Calculated Net Profit</div>
          <div className="text-xl font-black text-[#174D40] mt-1">
            ₹{metrics?.netProfit?.toLocaleString('en-IN') || 0}
          </div>
        </div>
      </div>

      {/* 4 Detail Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#174D40]" />
            <h3 className="font-extrabold text-sm text-[#171717]">Top Customers by Revenue</h3>
          </div>
          <div className="divide-y divide-[#EAEAEA] text-xs">
            {(reportData?.customerBreakdown || []).map((c: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#171717]">{c.name}</span>
                  <div className="text-[10px] text-[#929292]">{c.count} invoices issued</div>
                </div>
                <span className="font-black text-sm text-[#174D40]">
                  ₹{c.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#174D40]" />
            <h3 className="font-extrabold text-sm text-[#171717]">Product Sales Velocity</h3>
          </div>
          <div className="divide-y divide-[#EAEAEA] text-xs">
            {(reportData?.productBreakdown || []).map((p: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#171717]">{p.name}</span>
                  <div className="text-[10px] text-[#929292]">{p.quantity} units sold</div>
                </div>
                <span className="font-black text-sm text-[#171717]">
                  ₹{p.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Procurement */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-[#174D40]" />
            <h3 className="font-extrabold text-sm text-[#171717]">Supplier Procurement Volume</h3>
          </div>
          <div className="divide-y divide-[#EAEAEA] text-xs">
            {(reportData?.supplierBreakdown || []).map((s: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#171717]">{s.name}</span>
                  <div className="text-[10px] text-[#929292]">{s.count} purchase orders</div>
                </div>
                <span className="font-black text-sm text-[#171717]">
                  ₹{s.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-[#174D40]" />
            <h3 className="font-extrabold text-sm text-[#171717]">Expenditure by Category</h3>
          </div>
          <div className="divide-y divide-[#EAEAEA] text-xs">
            {(reportData?.expenseBreakdown || []).map((e: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#171717]">{e.name}</span>
                <span className="font-black text-sm text-[#F87171]">
                  ₹{e.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
