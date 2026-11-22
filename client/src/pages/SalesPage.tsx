import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
  Printer,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Sale, Customer, Product } from '../types';
import { InvoiceViewModal } from '../modals/InvoiceViewModal';
import { useSearchParams } from 'react-router-dom';

export const SalesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSaleForView, setSelectedSaleForView] = useState<Sale | null>(null);

  // New Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Invoice Line Items
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
      const [salesRes, custRes, prodRes] = await Promise.all([
        apiRequest<{ sales: Sale[] }>('/sales'),
        apiRequest<{ customers: Customer[] }>('/customers'),
        apiRequest<{ products: Product[] }>('/products'),
      ]);
      setSales(salesRes.sales);
      setCustomers(custRes.customers);
      setProducts(prodRes.products);

      if (custRes.customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(custRes.customers[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('new') === 'true') {
      setIsCreateModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [activeBusiness]);

  // Handle item change in modal
  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId,
      unitPrice: prod ? prod.sellingPrice : 0,
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

  // Live Totals Calculation
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
  const remainingDue = Math.max(0, Math.round((grandTotal - amountReceived) * 100) / 100);

  // Submit invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    // Validation
    for (const itm of items) {
      if (!itm.productId) {
        setFormError('Please select a product for all line items');
        setFormSubmitting(false);
        return;
      }
      const prod = products.find((p) => p.id === itm.productId);
      if (prod && prod.currentStock < itm.quantity) {
        setFormError(
          `Insufficient stock for "${prod.name}". Available stock: ${prod.currentStock}, Requested: ${itm.quantity}`
        );
        setFormSubmitting(false);
        return;
      }
    }

    try {
      const res = await apiRequest<{ sale: Sale }>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          date: invoiceDate,
          dueDate: dueDate || undefined,
          items,
          paymentMethod,
          amountReceived,
          isInterState,
          notes,
        }),
      });

      setIsCreateModalOpen(false);
      await loadData();
      setSelectedSaleForView(res.sale);
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? s.paymentStatus === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Sales & Invoicing</h1>
          <p className="text-xs text-[#929292] mt-1">
            Generate GST-compliant invoices. Inventory decrements and accounts update automatically.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setAmountReceived(grandTotal);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-semibold text-[#171717] focus:outline-none"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Invoice #</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Customer</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Items</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Grand Total</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Received</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Balance Due</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#929292]">
                    No sales invoices found. Click &quot;Create New Invoice&quot; to issue your first bill.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="py-3.5 font-bold text-[#171717]">{sale.invoiceNumber}</td>
                    <td className="py-3.5 text-[#929292]">{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3.5 font-semibold text-[#171717]">{sale.customer.name}</td>
                    <td className="py-3.5 text-center font-bold">{sale.items.length}</td>
                    <td className="py-3.5 text-right font-bold text-[#171717]">
                      ₹{sale.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right text-[#174D40] font-semibold">
                      ₹{sale.amountReceived.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-semibold text-[#F87171]">
                      {sale.remainingBalance > 0 ? `₹${sale.remainingBalance.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.paymentStatus === 'PAID'
                            ? 'bg-[#E8F8DE] text-[#174D40]'
                            : sale.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-[#F87171]'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSaleForView(sale)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-extrabold text-lg text-[#171717]">New Sales Invoice</h3>
                <p className="text-xs text-[#929292]">Real-time stock validation and automated accounting updates</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171] flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-6 pt-4 text-xs">
              {/* Customer and General Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Select Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.gstin ? `(GSTIN: ${c.gstin})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              {/* Tax Type / Inter-State toggle */}
              <div className="flex items-center gap-4 p-3 bg-[#F5F5F5] rounded-xl">
                <label className="flex items-center gap-2 font-semibold text-[#171717] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInterState}
                    onChange={(e) => setIsInterState(e.target.checked)}
                    className="rounded text-[#174D40] focus:ring-0 w-4 h-4"
                  />
                  <span>Inter-State Supply (Apply IGST instead of CGST+SGST)</span>
                </label>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#171717]">Products / Line Items</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs font-bold text-[#174D40] hover:underline"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isStockLow = prod && prod.currentStock < item.quantity;

                    return (
                      <div
                        key={index}
                        className={`grid grid-cols-12 gap-2 p-3 rounded-2xl border items-center ${
                          isStockLow ? 'bg-red-50/50 border-red-200' : 'bg-[#F5F5F5]/60 border-[#EAEAEA]'
                        }`}
                      >
                        {/* Product selector (4 cols) */}
                        <div className="col-span-12 sm:col-span-4">
                          <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemProductChange(index, e.target.value)}
                            required
                            className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs"
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                          {prod && (
                            <span className={`text-[10px] ${isStockLow ? 'text-[#F87171] font-bold' : 'text-[#929292]'}`}>
                              Available stock: {prod.currentStock} {prod.unit}
                            </span>
                          )}
                        </div>

                        {/* Qty (2 cols) */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs text-center font-bold"
                          />
                        </div>

                        {/* Unit Price (2 cols) */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemFieldChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs font-semibold"
                          />
                        </div>

                        {/* Discount (2 cols) */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] text-[#929292] font-semibold mb-0.5">Discount (₹)</label>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemFieldChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-[#EAEAEA] rounded-xl p-2 text-xs"
                          />
                        </div>

                        {/* Line Total & Delete (2 cols) */}
                        <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] text-[#929292] block">Total</span>
                            <span className="font-bold text-xs text-[#174D40]">
                              ₹{(
                                Math.max(0, item.quantity * item.unitPrice - (item.discount || 0)) *
                                (1 + (item.taxRate || 18) / 100)
                              ).toFixed(0)}
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
                    );
                  })}
                </div>
              </div>

              {/* Payment Details & Financial Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#EAEAEA]">
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                    >
                      <option value="UPI">UPI (Instant GooglePay/PhonePe/Paytm)</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">Amount Received Now (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs font-bold text-[#171717]"
                      />
                      <button
                        type="button"
                        onClick={() => setAmountReceived(grandTotal)}
                        className="px-3 py-1 bg-[#E8F8DE] text-[#174D40] text-[11px] font-bold rounded-xl whitespace-nowrap"
                      >
                        Full Paid
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">Notes / Terms</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Year Standard Manufacturer Warranty Included"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-[#F5F5F5] p-5 rounded-2xl space-y-2">
                  <div className="flex justify-between text-[#929292]">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-[#171717]">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>Discounts:</span>
                    <span className="font-semibold text-[#171717]">-₹{totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>GST (Tax):</span>
                    <span className="font-semibold text-[#171717]">₹{totalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-[#EAEAEA] pt-2 flex justify-between text-base font-extrabold text-[#174D40]">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-semibold text-xs">
                    <span className="text-[#929292]">Amount Received:</span>
                    <span className="text-[#174D40]">₹{amountReceived.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-xs">
                    <span className="text-[#929292]">Remaining Customer Balance:</span>
                    <span className={remainingDue > 0 ? 'text-[#F87171]' : 'text-[#174D40]'}>
                      ₹{remainingDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                    'Generating Invoice & Updating Stock...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} className="text-[#98E66B]" />
                      Issue Invoice & Auto-Update Ecosystem
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedSaleForView && (
        <InvoiceViewModal
          sale={selectedSaleForView}
          onClose={() => setSelectedSaleForView(null)}
        />
      )}
    </div>
  );
};
