import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Users,
  IndianRupee,
  Package,
  Truck,
  Receipt,
  TrendingUp,
  Boxes,
  Plus,
  Filter,
  Eye,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { apiRequest } from '../services/api';
import { DashboardData, Sale } from '../types';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SalesGauge } from '../components/dashboard/SalesGauge';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { InvoiceViewModal } from '../modals/InvoiceViewModal';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSaleForView, setSelectedSaleForView] = useState<Sale | null>(null);
  const [salesSearch, setSalesSearch] = useState('');

  const loadDashboard = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest<DashboardData>('/dashboard');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [activeBusiness]);

  const viewInvoiceDetails = async (saleId: string) => {
    try {
      const res = await apiRequest<{ sale: Sale }>(`/sales/${saleId}`);
      setSelectedSaleForView(res.sale);
    } catch (err: any) {
      alert('Could not load invoice: ' + err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#174D40] flex items-center justify-center animate-spin">
          <div className="w-6 h-6 border-2 border-[#98E66B] border-t-transparent rounded-full"></div>
        </div>
        <p className="text-sm font-semibold text-[#929292]">Connecting to MULTISOLVE Central Database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-red-200 text-center space-y-3">
        <AlertTriangle size={36} className="text-[#F87171] mx-auto" />
        <h3 className="font-bold text-lg text-[#171717]">Failed to load live metrics</h3>
        <p className="text-xs text-[#929292]">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-[#174D40] text-white text-xs font-semibold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = data?.kpis;
  const recentSalesFiltered = (data?.recentSales || []).filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.customer.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.product.toLowerCase().includes(salesSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'Partner'}!
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8DE] text-[#174D40]">
              <Sparkles size={12} className="mr-1 text-[#174D40]" />
              Live Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#929292] mt-1">
            Here is your business overview for{' '}
            <span className="font-bold text-[#171717]">{activeBusiness?.name}</span>. Enter data once; everything else updates automatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboard()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#EAEAEA] text-xs font-semibold text-[#171717] hover:bg-[#F5F5F5] transition-colors shadow-2xs"
          >
            <Filter size={15} className="text-[#929292]" />
            <span>Filter</span>
          </button>

          <button
            onClick={() => navigate('/sales?new=true')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus size={16} className="text-[#98E66B]" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (8 Connected Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales"
          value={kpis?.totalSales.value || 0}
          change={kpis?.totalSales.change || '+0%'}
          isPositive={kpis?.totalSales.isPositive ?? true}
          icon={ShoppingCart}
          tooltip="Gross invoice totals recorded in system"
          isCurrency
        />
        <KpiCard
          title="Total Customers"
          value={kpis?.totalCustomers.value || 0}
          change={kpis?.totalCustomers.change || '+0%'}
          isPositive={kpis?.totalCustomers.isPositive ?? true}
          icon={Users}
          tooltip="Active customer accounts registered"
        />
        <KpiCard
          title="Total Revenue"
          value={kpis?.totalRevenue.value || 0}
          change={kpis?.totalRevenue.change || '+0%'}
          isPositive={kpis?.totalRevenue.isPositive ?? true}
          icon={IndianRupee}
          tooltip="Net taxable sales revenue (excluding taxes)"
          isCurrency
        />
        <KpiCard
          title="Total Products"
          value={kpis?.totalProducts.value || 0}
          change={kpis?.totalProducts.change || '0'}
          isPositive={kpis?.totalProducts.isPositive ?? true}
          icon={Package}
          tooltip="Active SKU inventory catalog"
        />
        <KpiCard
          title="Total Purchases"
          value={kpis?.totalPurchases.value || 0}
          change={kpis?.totalPurchases.change || '0%'}
          isPositive={kpis?.totalPurchases.isPositive ?? true}
          icon={Truck}
          tooltip="Total procurement bills paid & payable"
          isCurrency
        />
        <KpiCard
          title="Total Expenses"
          value={kpis?.totalExpenses.value || 0}
          change={kpis?.totalExpenses.change || '+0%'}
          isPositive={kpis?.totalExpenses.isPositive ?? false}
          icon={Receipt}
          tooltip="Operating expenses (Rent, Salaries, Utilities, etc.)"
          isCurrency
        />
        <KpiCard
          title="Estimated Net Profit"
          value={kpis?.estimatedNetProfit.value || 0}
          change={kpis?.estimatedNetProfit.change || '+0%'}
          isPositive={kpis?.estimatedNetProfit.isPositive ?? true}
          icon={TrendingUp}
          tooltip="Net Profit = Revenue - Purchases/COGS - Operating Expenses"
          isCurrency
        />
        <KpiCard
          title="Inventory Value"
          value={kpis?.inventoryValue.value || 0}
          change={kpis?.inventoryValue.change || '0 low stock'}
          isPositive={kpis?.inventoryValue.isPositive ?? true}
          icon={Boxes}
          tooltip="Real-time stock valuation based on cost price"
          isCurrency
        />
      </div>

      {/* 3. Sales Overview & Revenue Insights (Grid of 2 major charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Semicircular Gauge: Sales Overview (5 cols) */}
        <div className="lg:col-span-5">
          {data?.salesOverview && (
            <SalesGauge
              progressPercentage={data.salesOverview.progressPercentage}
              monthlySalesGoal={data.salesOverview.monthlySalesGoal}
              currentSales={data.salesOverview.currentSales}
              growthPercentage={data.salesOverview.growthPercentage}
              netProfit={data.salesOverview.netProfit}
              grossRevenue={data.salesOverview.grossRevenue}
            />
          )}
        </div>

        {/* Vertical Bar Chart: Revenue Insights (7 cols) */}
        <div className="lg:col-span-7">
          {data?.revenueInsights && (
            <RevenueChart
              totalRevenue={data.revenueInsights.totalRevenue}
              data={data.revenueInsights.chartData}
            />
          )}
        </div>
      </div>

      {/* 4. Recent Sales Table with search and status badges */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-[#171717]">Recent Sales</h3>
            <p className="text-xs text-[#929292]">Real-time transactional feed</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search sales..."
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              className="px-3.5 py-1.5 text-xs bg-[#F5F5F5] rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none transition-all placeholder:text-[#929292]"
            />
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-bold text-[#174D40] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Invoice #</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Customer</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Product</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Qty</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {recentSalesFiltered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#929292]">
                    No sales invoices found matching your filter.
                  </td>
                </tr>
              ) : (
                recentSalesFiltered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F5F5F5] transition-colors group">
                    <td className="py-3.5 font-bold text-[#171717]">{s.invoiceNumber}</td>
                    <td className="py-3.5 font-semibold text-[#171717]">{s.customer}</td>
                    <td className="py-3.5 text-[#929292]">{s.product}</td>
                    <td className="py-3.5 text-center font-bold">{s.quantity}</td>
                    <td className="py-3.5 text-[#929292]">{s.date}</td>
                    <td className="py-3.5 text-right font-bold text-[#171717]">
                      ₹{s.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.paymentStatus === 'PAID'
                            ? 'bg-[#E8F8DE] text-[#174D40]'
                            : s.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-[#F87171]'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => viewInvoiceDetails(s.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom 3-Card Grid: Low Stock Alerts, Recent Purchases, Outstanding Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Low Stock Warning Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#F87171]" />
                <h3 className="font-bold text-sm text-[#171717]">Low Stock Alerts</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#F87171]">
                {data?.lowStockProducts.length || 0} items
              </span>
            </div>

            <div className="divide-y divide-[#EAEAEA] py-2">
              {(data?.lowStockProducts || []).length === 0 ? (
                <div className="py-6 text-center text-xs text-[#929292]">
                  <CheckCircle2 size={24} className="text-[#98E66B] mx-auto mb-1" />
                  All products above safe inventory limits.
                </div>
              ) : (
                data?.lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#171717]">{p.name}</div>
                      <div className="text-[10px] text-[#929292]">SKU: {p.sku}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#F87171]">
                        {p.currentStock} {p.unit}
                      </span>
                      <div className="text-[10px] text-[#929292]">Alert at: {p.minStockAlert}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/purchases?new=true')}
            className="w-full mt-3 py-2 bg-[#F5F5F5] hover:bg-[#174D40] hover:text-white rounded-xl text-xs font-bold text-[#171717] transition-colors text-center"
          >
            Create Purchase Order
          </button>
        </div>

        {/* Recent Purchases Quick Feed */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#174D40]" />
                <h3 className="font-bold text-sm text-[#171717]">Recent Purchases</h3>
              </div>
              <button
                onClick={() => navigate('/purchases')}
                className="text-xs text-[#174D40] font-bold hover:underline"
              >
                All
              </button>
            </div>

            <div className="divide-y divide-[#EAEAEA] py-2">
              {(data?.recentPurchases || []).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#171717]">{p.supplier}</div>
                    <div className="text-[10px] text-[#929292]">{p.purchaseNumber} • {p.date}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#171717]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-[#174D40]">{p.paymentStatus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/purchases')}
            className="w-full mt-3 py-2 bg-[#F5F5F5] hover:bg-[#174D40] hover:text-white rounded-xl text-xs font-bold text-[#171717] transition-colors text-center"
          >
            Manage Suppliers & Invoices
          </button>
        </div>

        {/* Outstanding Receivables & Payables */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#174D40]" />
                <h3 className="font-bold text-sm text-[#171717]">Outstanding Balances</h3>
              </div>
              <button
                onClick={() => navigate('/accounting')}
                className="text-xs text-[#174D40] font-bold hover:underline"
              >
                Ledger
              </button>
            </div>

            <div className="space-y-3 py-3">
              <div className="p-3.5 bg-[#F5F5F5] rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#929292] font-medium">Accounts Receivable</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F8DE] text-[#174D40] font-bold">
                    Incoming Cash
                  </span>
                </div>
                <div className="text-lg font-extrabold text-[#171717] mt-1">
                  ₹{(data?.receivables || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-[#929292] mt-0.5">Owed by corporate clients</p>
              </div>

              <div className="p-3.5 bg-[#F5F5F5] rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#929292] font-medium">Accounts Payable</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    Outgoing Dues
                  </span>
                </div>
                <div className="text-lg font-extrabold text-[#171717] mt-1">
                  ₹{(data?.payables || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-[#929292] mt-0.5">Due to suppliers on credit terms</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/accounting')}
            className="w-full mt-3 py-2 bg-[#F5F5F5] hover:bg-[#174D40] hover:text-white rounded-xl text-xs font-bold text-[#171717] transition-colors text-center"
          >
            Open Double-Entry Books
          </button>
        </div>
      </div>

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
