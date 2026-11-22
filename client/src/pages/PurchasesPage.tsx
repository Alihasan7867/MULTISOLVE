import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Truck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Purchase, Supplier, Product } from '../types';
import { useSearchParams } from 'react-router-dom';

export const PurchasesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isInterState, setIsInterState] = useState(false);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<
    { productId: string; quantity: number; unitPrice: number; discount: number; taxRate: number }[]
  >([{ productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      setError(null);
      const [purRes, suppRes, prodRes] = await Promise.all([
        apiRequest<{ purchases: Purchase[] }>('/purchases'),
        apiRequest<{ suppliers: Supplier[] }>('/suppliers'),
        apiRequest<{ products: Product[] }>('/products'),
      ]);
      setPurchases(purRes.purchases);
      setSuppliers(suppRes.suppliers);
      setProducts(prodRes.products);

      if (suppRes.suppliers.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(suppRes.suppliers[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [activeBusiness]);

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId,
      unitPrice: prod ? prod.purchasePrice : 0,
      taxRate: prod?.taxRate !== undefined ? prod.taxRate : 18,
    };
    setItems(newItems);
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach((item) => {
    const base = item.quantity * item.unitPrice;
    const net = Math.max(0, base - (item.discount || 0));
    const tax = (net * (item.taxRate || 18)) / 100;
    subtotal += base;
    totalDiscount += item.discount || 0;
    totalTax += tax;
  });

  const grandTotal = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100;
  const remainingDue = Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    for (const itm of items) {
      if (!itm.productId) {
        setFormError('Please select a product for all items');
        setFormSubmitting(false);
        return;
      }
    }

    try {
      await apiRequest('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          date: purchaseDate,
          items,
          amountPaid,
          paymentMethod,
          isInterState,
          notes,
        }),
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record purchase');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Purchase Management</h1>
          <p className="text-xs text-[#929292] mt-1">
            Record supplier bills. Automatically increases inventory and updates payables & input GST credits.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setAmountPaid(grandTotal);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>New Purchase Bill</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search purchase bill or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Bill #</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Supplier</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Items</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Grand Total</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Paid</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#929292]">
                    No purchase orders recorded yet. Click &quot;New Purchase Bill&quot; to replenish stock.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#171717]">{p.purchaseNumber}</td>
                    <td className="py-3.5 text-[#929292]">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3.5 font-semibold text-[#171717]">{p.supplier.name}</td>
                    <td className="py-3.5 text-center font-bold">{p.items.length}</td>
                    <td className="py-3.5 text-right font-bold text-[#171717]">
                      ₹{p.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-semibold text-[#174D40]">
                      ₹{p.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-[#E8F8DE] text-[#174D40]'
                            : p.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-[#F87171]'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-extrabold text-lg text-[#171717]">Record Inward Purchase</h3>
                <p className="text-xs text-[#929292]">Automatically adds stock to inventory and updates accounts payable</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171] flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.gstin ? `(${s.gstin})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#171717]">Items Received</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-[#174D40] hover:underline"
                  >
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 p-3 bg-[#F5F5F5]/60 rounded-2xl border border-[#EAEAEA] items-center"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(index, e.target.value)}
                          required
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs"
                        >
                          <option value="">Select product to stock in...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Current Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs text-center font-bold"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Unit Cost (₹)</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemFieldChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-3 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#929292] block">Total (+18% GST)</span>
                          <span className="font-bold text-xs text-[#174D40]">
                            ₹{Math.round(item.quantity * item.unitPrice * 1.18).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          disabled={items.length === 1}
                          className="text-[#929292] hover:text-[#F87171] p-1.5 rounded-lg hover:bg-white disabled:opacity-30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#EAEAEA]">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Amount Paid Upfront (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs font-bold text-[#171717]"
                    />
                    <button
                      type="button"
                      onClick={() => setAmountPaid(grandTotal)}
                      className="px-3 py-1 bg-[#E8F8DE] text-[#174D40] text-[11px] font-bold rounded-xl whitespace-nowrap"
                    >
                      Paid in Full
                    </button>
                  </div>
                </div>

                <div className="bg-[#F5F5F5] p-5 rounded-2xl space-y-2">
                  <div className="flex justify-between text-[#929292]">
                    <span>Items Total:</span>
                    <span className="font-semibold text-[#171717]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>Input GST (18% ITC):</span>
                    <span className="font-semibold text-[#171717]">₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-[#EAEAEA] pt-2 flex justify-between text-base font-extrabold text-[#174D40]">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-xs">
                    <span className="text-[#929292]">Remaining Supplier Payable:</span>
                    <span className={remainingDue > 0 ? 'text-amber-800' : 'text-[#174D40]'}>
                      ₹{remainingDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#929292] hover:text-[#171717]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? (
                    'Recording Purchase...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} className="text-[#98E66B]" />
                      Record Purchase & Increase Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-bold text-base text-[#171717]">Purchase Bill Details</h3>
                <p className="text-xs text-[#929292]">{selectedPurchase.purchaseNumber}</p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#F5F5F5] p-4 rounded-2xl">
                <div>
                  <span className="text-[#929292] block">Supplier</span>
                  <span className="font-bold text-[#171717]">{selectedPurchase.supplier.name}</span>
                  <div className="text-[11px] text-[#929292]">{selectedPurchase.supplier.city}</div>
                </div>
                <div className="text-right">
                  <span className="text-[#929292] block">Date</span>
                  <span className="font-bold text-[#171717]">
                    {new Date(selectedPurchase.date).toLocaleDateString('en-IN')}
                  </span>
                  <div className="text-[11px] font-bold text-[#174D40]">
                    Status: {selectedPurchase.paymentStatus}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#171717] mb-2">Purchased Items</h4>
                <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F5F5] text-[#929292]">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Cost</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {selectedPurchase.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-[#171717]">
                            {item.product?.name || 'Item'}
                          </td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-bold text-[#171717]">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#EAEAEA]">
                <span className="text-xs font-semibold text-[#929292]">Total Bill Amount:</span>
                <span className="text-base font-extrabold text-[#174D40]">
                  ₹{selectedPurchase.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
