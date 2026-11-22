import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  X,
  PackageCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Sale } from '../types';

export const OrdersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Simulated order fulfillment status for demo
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      if (!activeBusiness) return;
      try {
        setLoading(true);
        const res = await apiRequest<{ sales: Sale[] }>('/sales');
        setSales(res.sales);
        const initialMap: Record<string, string> = {};
        res.sales.forEach((s, idx) => {
          initialMap[s.id] = idx === 0 ? 'Delivered' : idx === 1 ? 'In Transit' : 'Processing';
        });
        setOrderStatuses(initialMap);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeBusiness]);

  const updateStatus = (saleId: string, newStatus: string) => {
    setOrderStatuses((prev) => ({ ...prev, [saleId]: newStatus }));
  };

  const filtered = sales.filter((s) => {
    const status = orderStatuses[s.id] || 'Processing';
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus ? status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Order Fulfillment</h1>
          <p className="text-xs text-[#929292] mt-1">
            Track shipment dispatches, carrier tracking and order delivery milestones.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F8DE] text-[#174D40] text-xs font-bold self-start sm:self-auto">
          <PackageCheck size={16} />
          <span>Automated Dispatch Pipeline</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search order or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-semibold text-[#171717] focus:outline-none"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="Processing">Processing</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Order #</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Customer & Destination</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Items</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Fulfillment Status</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filtered.map((sale) => {
                const status = orderStatuses[sale.id] || 'Processing';
                return (
                  <tr key={sale.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#171717]">{sale.invoiceNumber}</td>
                    <td className="py-3.5 text-[#929292]">{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-[#171717]">{sale.customer.name}</div>
                      <div className="text-[10px] text-[#929292]">{sale.customer.city || 'Mumbai'}, India</div>
                    </td>
                    <td className="py-3.5 text-center font-bold">{sale.items.length} pkgs</td>
                    <td className="py-3.5 text-right font-bold text-[#171717]">
                      ₹{sale.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === 'Delivered'
                            ? 'bg-[#E8F8DE] text-[#174D40]'
                            : status === 'In Transit'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {status === 'Delivered' && <CheckCircle2 size={12} />}
                        {status === 'In Transit' && <Truck size={12} />}
                        {status === 'Processing' && <Clock size={12} />}
                        {status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <select
                        value={status}
                        onChange={(e) => updateStatus(sale.id, e.target.value)}
                        className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-lg px-2 py-1 text-[11px] font-semibold text-[#171717]"
                      >
                        <option value="Processing">Processing</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
