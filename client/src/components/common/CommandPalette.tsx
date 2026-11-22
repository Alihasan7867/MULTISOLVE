import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Truck,
  Package,
  Boxes,
  Users,
  Building2,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Sparkles,
  Wallet,
  Settings,
  HelpCircle,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { apiRequest } from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickSale: () => void;
  onOpenQuickPurchase: () => void;
  onOpenQuickExpense: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenQuickSale,
  onOpenQuickPurchase,
  onOpenQuickExpense,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    apiRequest<{ products: any[] }>('/products')
      .then((r) => setProducts(r.products || []))
      .catch(() => {});
    apiRequest<{ customers: any[] }>('/customers')
      .then((r) => setCustomers(r.customers || []))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Dashboard Overview', path: '/', icon: BarChart3 },
    { label: 'Sales Invoices', path: '/sales', icon: ShoppingCart },
    { label: 'Product Inventory', path: '/inventory', icon: Boxes },
    { label: 'Purchase Procurement', path: '/purchases', icon: Truck },
    { label: 'Customer Accounts', path: '/customers', icon: Users },
    { label: 'Vendor Directory', path: '/suppliers', icon: Building2 },
    { label: 'Double-Entry Ledgers', path: '/accounting', icon: BookOpen },
    { label: 'GST Tax Center', path: '/gst', icon: FileSpreadsheet },
    { label: 'AI Intelligence Engine', path: '/automation', icon: Sparkles },
    { label: 'Personal Finance Space', path: '/personal-finance', icon: Wallet },
  ];

  const filteredNav = quickNav.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);

  const filteredCustomers = customers
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query))
    .slice(0, 3);

  const handleSelectNav = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#EAEAEA] overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#EAEAEA]">
          <Search size={18} className="text-[#174D40] mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Type a page name, product SKU, or customer to jump..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-[#171717] bg-transparent focus:outline-none placeholder:text-[#929292]"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content list */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Action Shortcuts */}
          <div>
            <span className="text-[10px] font-bold text-[#929292] uppercase tracking-wider px-2 block mb-1.5">
              Quick Actions
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenQuickSale();
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#F5F5F5] hover:bg-[#E8F8DE] text-[#171717] hover:text-[#174D40] font-semibold transition-colors"
              >
                <Plus size={14} className="text-[#174D40]" />
                <span>New Invoice</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenQuickPurchase();
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#F5F5F5] hover:bg-blue-50 text-[#171717] hover:text-blue-800 font-semibold transition-colors"
              >
                <Plus size={14} className="text-blue-700" />
                <span>New Purchase</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenQuickExpense();
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#F5F5F5] hover:bg-orange-50 text-[#171717] hover:text-orange-800 font-semibold transition-colors"
              >
                <Plus size={14} className="text-orange-700" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <span className="text-[10px] font-bold text-[#929292] uppercase tracking-wider px-2 block mb-1">
              Modules & Workspaces
            </span>
            <div className="space-y-1">
              {filteredNav.map((n, i) => {
                const Icon = n.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectNav(n.path)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F5F5] text-[#171717] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="text-[#174D40]" />
                      <span className="font-semibold">{n.label}</span>
                    </div>
                    <ArrowRight size={13} className="text-[#929292]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products match */}
          {filteredProducts.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-[#929292] uppercase tracking-wider px-2 block mb-1">
                Matching Catalog Products
              </span>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectNav('/products')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F5F5] text-[#171717]"
                  >
                    <div>
                      <div className="font-bold text-left">{p.name}</div>
                      <div className="text-[10px] text-[#929292] text-left">SKU: {p.sku} • In Stock: {p.currentStock} {p.unit}</div>
                    </div>
                    <span className="font-bold text-[#174D40]">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers match */}
          {filteredCustomers.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-[#929292] uppercase tracking-wider px-2 block mb-1">
                Matching Customers
              </span>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectNav('/customers')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F5F5] text-[#171717]"
                  >
                    <div>
                      <div className="font-bold text-left">{c.name}</div>
                      <div className="text-[10px] text-[#929292] text-left">{c.phone}</div>
                    </div>
                    {c.currentBalance > 0 && (
                      <span className="text-[11px] font-bold text-[#F87171]">Owes ₹{c.currentBalance.toLocaleString('en-IN')}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F5F5F5] border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#929292]">
          <span>Use <strong>ESC</strong> to close</span>
          <span>MULTISOLVE Global Search</span>
        </div>
      </div>
    </div>
  );
};
