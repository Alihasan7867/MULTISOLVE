import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Building,
  Plus,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Menu,
  ShoppingCart,
  Truck,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
  onOpenQuickExpense?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuClick,
  onOpenQuickSale,
  onOpenQuickPurchase,
  onOpenQuickExpense,
  onOpenCommandPalette,
}) => {
  const { user, logout } = useAuth();
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenCommandPalette) onOpenCommandPalette();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) {
        setQuickActionOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#EAEAEA] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5] rounded-lg"
        >
          <Menu size={20} />
        </button>

        <div
          onClick={onOpenCommandPalette}
          className="relative w-full cursor-pointer"
        >
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929292]"
          />
          <input
            type="text"
            readOnly
            onClick={onOpenCommandPalette}
            placeholder="Search products, invoices, customers... (Ctrl+K)"
            className="w-full bg-[#F5F5F5] text-sm text-[#171717] pl-10 pr-14 py-2 rounded-xl border border-transparent hover:border-[#174D40]/30 focus:border-[#174D40] focus:bg-white focus:outline-none transition-all placeholder:text-[#929292] cursor-pointer"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#929292] bg-white border border-[#EAEAEA] px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Actions, Business Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <div className="relative" ref={quickActionRef}>
          <button
            onClick={() => setQuickActionOpen(!quickActionOpen)}
            className="flex items-center gap-2 bg-[#174D40] hover:bg-[#133E34] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={16} className="text-[#98E66B]" />
            <span className="hidden sm:inline">New Transaction</span>
          </button>

          {quickActionOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#EAEAEA] py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#929292] uppercase tracking-wider">
                Create New
              </div>
              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  if (onOpenQuickSale) onOpenQuickSale();
                  else navigate('/sales?new=true');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#171717] hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#E8F8DE] text-[#174D40] flex items-center justify-center">
                  <ShoppingCart size={15} />
                </div>
                <span>Sales Invoice</span>
              </button>
              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  if (onOpenQuickPurchase) onOpenQuickPurchase();
                  else navigate('/purchases?new=true');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#171717] hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Truck size={15} />
                </div>
                <span>Purchase Bill</span>
              </button>
              <button
                onClick={() => {
                  setQuickActionOpen(false);
                  if (onOpenQuickExpense) onOpenQuickExpense();
                  else navigate('/expenses?new=true');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#171717] hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
                  <Receipt size={15} />
                </div>
                <span>Record Expense</span>
              </button>
            </div>
          )}
        </div>

        {/* Business Identity Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#EAEAEA] bg-[#F5F5F5] text-xs font-semibold text-[#171717]">
          <Building size={14} className="text-[#174D40]" />
          <span className="max-w-[150px] truncate">
            {activeBusiness ? activeBusiness.name : 'MULTISOLVE'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-[#EAEAEA] flex items-center justify-center text-[#929292] hover:text-[#171717] hover:bg-[#F5F5F5] relative transition-colors"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F87171]"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#EAEAEA] p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
                <span className="text-xs font-bold text-[#171717]">Notifications</span>
                <span className="text-[10px] text-[#174D40] font-semibold cursor-pointer">
                  Mark all read
                </span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F5F5F5] flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-[#F87171] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#171717]">Low Stock Notification</div>
                    <div className="text-[#929292] text-[11px] mt-0.5">
                      MacBook Pro 16&quot; stock reached threshold (3 remaining).
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F5F5F5] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#174D40] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#171717]">Payment Received</div>
                    <div className="text-[#929292] text-[11px] mt-0.5">
                      ₹45,000 received for invoice INV-2026-00014.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#174D40] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#171717] leading-tight">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-[#929292] leading-tight font-medium">
                {user?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown size={14} className="text-[#929292] hidden md:inline" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#EAEAEA] py-2 z-50">
              <div className="px-3 py-2 border-b border-[#EAEAEA]">
                <p className="text-xs font-bold text-[#171717]">{user?.name}</p>
                <p className="text-[11px] text-[#929292] truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#171717] hover:bg-[#F5F5F5]"
              >
                <UserIcon size={14} className="text-[#929292]" /> Profile & Settings
              </button>
              <div className="border-t border-[#EAEAEA] my-1"></div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#F87171] hover:bg-red-50 font-medium"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
