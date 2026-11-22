import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Product, ProductCategory } from '../types';

export const ProductsPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState('PCS');
  const [hsnCode, setHsnCode] = useState('');
  const [taxRate, setTaxRate] = useState<number>(18);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        apiRequest<{ products: Product[] }>('/products'),
        apiRequest<{ categories: ProductCategory[] }>('/products/categories'),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setDescription('');
    setPurchasePrice(0);
    setSellingPrice(0);
    setInitialStock(0);
    setMinStockAlert(5);
    setUnit('PCS');
    setHsnCode('');
    setTaxRate(18);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.categoryId || '');
    setDescription(p.description || '');
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setInitialStock(p.currentStock);
    setMinStockAlert(p.minStockAlert);
    setUnit(p.unit);
    setHsnCode(p.hsnCode || '');
    setTaxRate(p.taxRate);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            sku,
            categoryId: categoryId || undefined,
            description,
            purchasePrice,
            sellingPrice,
            minStockAlert,
            unit,
            hsnCode,
            taxRate,
          }),
        });
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify({
            name,
            sku,
            categoryId: categoryId || undefined,
            description,
            purchasePrice,
            sellingPrice,
            initialStock,
            minStockAlert,
            unit,
            hsnCode,
            taxRate,
          }),
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to delete/archive "${prodName}"?`)) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchLow = showLowStockOnly ? p.currentStock <= p.minStockAlert : true;
    return matchSearch && matchCat && matchLow;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Products & Catalog</h1>
          <p className="text-xs text-[#929292] mt-1">
            Manage your items, selling prices, purchasing costs and stock replenishment thresholds.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-semibold text-[#171717] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#171717] cursor-pointer bg-[#F5F5F5] px-3 py-2 rounded-xl border border-[#EAEAEA]">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded text-[#174D40]"
            />
            <span>Low Stock Alert</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Product & SKU</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Purchase Cost</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Selling Price</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Available Stock</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">GST Rate</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#929292]">
                    No products found. Click &quot;Add New Product&quot; to populate your catalog.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStockAlert;
                  return (
                    <tr key={prod.id} className="hover:bg-[#F5F5F5] transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-[#171717]">{prod.name}</div>
                        <div className="text-[10px] text-[#929292]">SKU: {prod.sku} • HSN: {prod.hsnCode || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 text-[#929292]">{prod.category?.name || 'General'}</td>
                      <td className="py-3.5 text-right font-medium text-[#929292]">
                        ₹{prod.purchasePrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-right font-bold text-[#171717]">
                        ₹{prod.sellingPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow ? 'bg-red-50 text-[#F87171]' : 'bg-[#E8F8DE] text-[#174D40]'
                          }`}
                        >
                          {isLow && <AlertTriangle size={12} />}
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-semibold text-[#929292]">{prod.taxRate}%</td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-[#929292] hover:text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 text-[#929292] hover:text-[#F87171] hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete / Archive Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-extrabold text-base text-[#171717]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-[#929292]">Enter master catalog details</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-[#171717] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wireless Ergonomic Keyboard"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. KEY-W-01"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block font-semibold text-[#171717] mb-1">Initial Opening Stock</label>
                    <input
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Min Stock Alert Level</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="BOX">Box (BOX)</option>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="MTR">Meters (MTR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="e.g. 84713010"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#171717] mb-1">GST Tax Rate (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#929292]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
