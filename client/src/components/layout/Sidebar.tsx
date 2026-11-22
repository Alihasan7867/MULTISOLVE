import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
  Users,
  Building2,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navSections = [
    {
      group: 'MAIN',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/sales', label: 'Sales', icon: ShoppingCart },
        { path: '/orders', label: 'Orders', icon: ShoppingBag },
        { path: '/products', label: 'Products', icon: Package },
        { path: '/inventory', label: 'Inventory', icon: Boxes },
        { path: '/purchases', label: 'Purchases', icon: Truck },
      ],
    },
    {
      group: 'FINANCE & TAX',
      items: [
        { path: '/expenses', label: 'Expenses', icon: Receipt },
        { path: '/accounting', label: 'Accounting', icon: BookOpen },
        { path: '/gst', label: 'GST Management', icon: FileSpreadsheet },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/personal-finance', label: 'Personal Finance', icon: Wallet },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/suppliers', label: 'Suppliers', icon: Building2 },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
        { path: '/help', label: 'Help Center', icon: HelpCircle },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-[#EAEAEA] transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#EAEAEA]">
          <div className="flex items-center space-x-3 overflow-hidden">
            {/* Geometric MULTISOLVE Logo */}
            <div className="w-9 h-9 rounded-xl bg-[#174D40] flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group">
              <div className="w-5 h-5 relative">
                <span className="absolute inset-0 bg-[#98E66B] rounded-sm transform rotate-45 scale-75 transition-transform group-hover:scale-90"></span>
                <span className="absolute inset-0.5 bg-[#174D40] rounded-sm transform rotate-45 scale-50"></span>
              </div>
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wider text-[#171717]">
                  MULTI<span className="text-[#174D40]">SOLVE</span>
                </span>
                <span className="text-[10px] text-[#929292] uppercase tracking-widest font-semibold -mt-0.5">
                  Business OS
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold text-[#929292] tracking-wider uppercase">
                  {section.group}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative
                      ${
                        isActive
                          ? 'bg-[#174D40] text-white shadow-sm font-semibold'
                          : 'text-[#171717] hover:bg-[#F5F5F5] hover:text-[#174D40]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={19}
                          className={`flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#98E66B]'
                              : 'text-[#929292] group-hover:text-[#174D40]'
                          }`}
                        />
                        {!collapsed && <span>{item.label}</span>}
                        {collapsed && (
                          <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#171717] text-white text-xs rounded-md shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Tagline / Mini status */}
        {!collapsed && (
          <div className="p-4 mx-3 mb-3 bg-[#F5F5F5] rounded-xl border border-[#EAEAEA]/80">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#98E66B] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#174D40] uppercase tracking-wider">
                Ecosystem Connected
              </span>
            </div>
            <p className="text-[11px] text-[#929292] leading-tight">
              Enter data once. Everything else happens automatically.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
