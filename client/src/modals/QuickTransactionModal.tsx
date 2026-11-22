import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Truck, Receipt, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Customer, Supplier, Product, ExpenseCategory } from '../types';

interface QuickTransactionModalProps {
  type: 'sale' | 'purchase' | 'expense';
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  type: initialType,
  onClose,
  onSuccess,
}) => {
  const [type, setType] = useState<'sale' | 'purchase' | 'expense'>(initialType);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, sRes, pRes, expRes] = await Promise.all([
          apiRequest<{ customers: Customer[] }>('/customers'),
          apiRequest<{ suppliers: Supplier[] }>('/suppliers'),
          apiRequest<{ products: Product[] }>('/products'),
          apiRequest<{ categories: ExpenseCategory[] }>('/expenses/categories'),
        ]);
        setCustomers(cRes.customers);
        setSuppliers(sRes.suppliers);
        setProducts(pRes.products);
        setCategories(expRes.categories);

        if (cRes.customers.length > 0) setSelectedCustomerId(cRes.customers[0].id);
        if (sRes.suppliers.length > 0) setSelectedSupplierId(sRes.suppliers[0].id);
        if (pRes.products.length > 0) {
          setSelectedProductId(pRes.products[0].id);
          setUnitPrice(pRes.products[0].sellingPrice);
        }
        if (expRes.categories.length > 0) setSelectedCategoryId(expRes.categories[0].id);
      } catch (err: any) {
        console.error('Failed to load transaction master data:', err);
      }
    }
    loadData();
  }, []);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setUnitPrice(type === 'sale' ? prod.sellingPrice : prod.purchasePrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'sale') {
        const prod = products.find((p) => p.id === selectedProductId);
        if (!prod) throw new Error('Please select a product');
        if (prod.currentStock < quantity) {
          throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.currentStock}, Requested: ${quantity}`);
        }

        const subtotal = quantity * unitPrice;
        const tax = (subtotal * (prod.taxRate || 18)) / 100;
        const total = subtotal + tax;

        await apiRequest('/sales', {
          method: 'POST',
          body: JSON.stringify({
            customerId: selectedCustomerId,
            items: [{ productId: selectedProductId, quantity, unitPrice }],
            paymentMethod,
            amountReceived: total, // Quick full payment
          }),
        });
      } else if (type === 'purchase') {
        const prod = products.find((p) => p.id === selectedProductId);
        if (!prod) throw new Error('Please select a product');
        const subtotal = quantity * unitPrice;
        const tax = (subtotal * (prod.taxRate || 18)) / 100;
        const total = subtotal + tax;

        await apiRequest('/purchases', {
          method: 'POST',
          body: JSON.stringify({
            supplierId: selectedSupplierId,
            items: [{ productId: selectedProductId, quantity, unitPrice }],
            paymentMethod,
            amountPaid: total,
          }),
        });
      } else if (type === 'expense') {
        if (!title || !amount) throw new Error('Expense title and amount are required');
        await apiRequest('/expenses', {
          method: 'POST',
          body: JSON.stringify({
            categoryId: selectedCategoryId,
            title,
            amount,
            paymentMethod,
          }),
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
          <h3 className="font-bold text-base text-[#171717]">Quick Transaction</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-2 my-4 p-1 bg-[#F5F5F5] rounded-2xl">
          <button
            type="button"
            onClick={() => setType('sale')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'sale'
                ? 'bg-[#174D40] text-white shadow-xs'
                : 'text-[#929292] hover:text-[#171717]'
            }`}
          >
            <ShoppingCart size={14} className={type === 'sale' ? 'text-[#98E66B]' : ''} />
            Sale
          </button>
          <button
            type="button"
            onClick={() => setType('purchase')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'purchase'
                ? 'bg-[#174D40] text-white shadow-xs'
                : 'text-[#929292] hover:text-[#171717]'
            }`}
          >
            <Truck size={14} className={type === 'purchase' ? 'text-[#98E66B]' : ''} />
            Purchase
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'expense'
                ? 'bg-[#174D40] text-white shadow-xs'
                : 'text-[#929292] hover:text-[#171717]'
            }`}
          >
            <Receipt size={14} className={type === 'expense' ? 'text-[#98E66B]' : ''} />
            Expense
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171] flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {type === 'sale' && (
            <>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentBalance > 0 ? `(Owes ₹${c.currentBalance})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'purchase' && (
            <>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'expense' && (
            <>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#174D40]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Expense Title</label>
                <input
                  type="text"
                  placeholder="e.g. Courier charges, Office stationery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold text-[#171717] mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
            >
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#174D40] hover:bg-[#133E34] text-white flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <Check size={14} className="text-[#98E66B]" />
                  Save & Update Ecosystem
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
