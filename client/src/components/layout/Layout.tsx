import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { QuickTransactionModal } from '../../modals/QuickTransactionModal';
import { CommandPalette } from '../common/CommandPalette';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState<'sale' | 'purchase' | 'expense' | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          onOpenQuickSale={() => setQuickModalType('sale')}
          onOpenQuickPurchase={() => setQuickModalType('purchase')}
          onOpenQuickExpense={() => setQuickModalType('expense')}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Action Modal */}
      {quickModalType && (
        <QuickTransactionModal
          type={quickModalType}
          onClose={() => setQuickModalType(null)}
          onSuccess={() => {
            setQuickModalType(null);
            window.location.reload();
          }}
        />
      )}

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenQuickSale={() => setQuickModalType('sale')}
        onOpenQuickPurchase={() => setQuickModalType('purchase')}
        onOpenQuickExpense={() => setQuickModalType('expense')}
      />
    </div>
  );
};
