import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  X,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Product, InventoryMovement } from '../types';

export const InventoryPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [totalValuation, setTotalValuation] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [stockRes, movRes] = await Promise.all([
        apiRequest<{ products: Product[]; totalValuation: number; lowStockCount: number }>('/inventory/stock'),
        apiRequest<{ movements: InventoryMovement[] }>('/inventory/movements'),
      ]);
      setProducts(stockRes.products);
      setTotalValuation(stockRes.totalValuation);
      setLowStockCount(stockRes.lowStockCount);
      setMovements(movRes.movements);

      if (stockRes.products.length > 0 && !selectedProductId) {
        setSelectedProductId(stockRes.products[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustSubmitting(true);
    setAdjustError(null);

    try {
      await apiRequest('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          adjustmentType,
          quantity,
          reason,
        }),
      });

      setIsAdjustModalOpen(false);
      setReason('');
      await loadData();
    } catch (err: any) {
      setAdjustError(err.message || 'Stock adjustment failed');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMovements = movements.filter(
    (m) =>
      m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.referenceId && m.referenceId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-[#929292] mt-1">
            Real-time multi-channel stock levels with an immutable movement audit trail.
          </p>
        </div>

        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <SlidersHorizontal size={15} className="text-[#98E66B]" />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Inventory Valuation</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">
            ₹{totalValuation.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Calculated at purchase price across all items</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total SKUs in Warehouse</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">{products.length} Items</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Active catalog units</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Low Stock Alerts</div>
          <div className="text-2xl font-extrabold text-[#F87171] mt-1">{lowStockCount} Items</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Below minimum safe threshold</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'stock'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#929292] hover:text-[#171717]'
            }`}
          >
            Current Stock Status
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'movements'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#929292] hover:text-[#171717]'
            }`}
          >
            Audit Trail & Movements ({movements.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search stock or movement reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Current Stock */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAEAEA] text-[#929292]">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Product & SKU</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Unit</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">In Stock</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Threshold</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Valuation</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  const val = p.currentStock * p.purchasePrice;
                  return (
                    <tr key={p.id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-[#171717]">{p.name}</div>
                        <div className="text-[10px] text-[#929292]">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3.5 text-[#929292]">{p.category?.name || 'General'}</td>
                      <td className="py-3.5 text-center text-[#929292] font-semibold">{p.unit}</td>
                      <td className="py-3.5 text-right font-black text-sm text-[#171717]">
                        {p.currentStock}
                      </td>
                      <td className="py-3.5 text-center text-[#929292]">{p.minStockAlert}</td>
                      <td className="py-3.5 text-right font-semibold text-[#171717]">
                        ₹{val.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow ? 'bg-red-50 text-[#F87171]' : 'bg-[#E8F8DE] text-[#174D40]'
                          }`}
                        >
                          {isLow ? 'Low Stock Alert' : 'Healthy In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements Audit Trail */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAEAEA] text-[#929292]">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Product</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Type</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Quantity Delta</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Before → After</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredMovements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="py-3 text-[#929292]">
                        {new Date(m.date).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 font-bold text-[#171717]">{m.product.name}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === 'PURCHASE'
                              ? 'bg-blue-50 text-blue-700'
                              : m.type === 'SALE'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-black flex items-center justify-center gap-0.5 ${
                            isPositive ? 'text-[#174D40]' : 'text-[#F87171]'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {isPositive ? `+${m.quantity}` : `${m.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 text-center text-[#929292]">
                        <span className="font-semibold text-[#171717]">{m.previousStock}</span>
                        <span className="mx-1.5">→</span>
                        <span className="font-bold text-[#174D40]">{m.updatedStock}</span>
                      </td>
                      <td className="py-3 text-[#171717]">
                        <div className="font-medium">{m.reason || m.referenceType}</div>
                        {m.referenceId && (
                          <div className="text-[10px] text-[#929292]">Ref: {m.referenceId}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Manual Stock Correction</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 my-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171]">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-3 text-xs">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Action</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="ADD">+ Increase Stock</option>
                    <option value="DEDUCT">- Decrease / Write-off</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">
                  Reason for Adjustment (Audit Trail) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory count discrepancy, Damaged transit unit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#929292]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
