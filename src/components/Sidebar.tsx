/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../types';
import { 
  LayoutDashboard, Users, Package, FileText, LogOut, Shield, ShoppingBag, Truck, CreditCard, Menu, X, Download 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ currentTab, setTab, user, onLogout, mobileOpen, setMobileOpen }: SidebarProps) {
  
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: Shield,
          label: 'System Admin'
        };
      case 'Sales':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: ShoppingBag,
          label: 'Sales Division'
        };
      case 'Warehouse':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          icon: Truck,
          label: 'Logistics / WH'
        };
      case 'Accounts':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: CreditCard,
          label: 'Accounts Dept'
        };
    }
  };

  const badge = getRoleBadge(user.role);
  const BadgeIcon = badge.icon;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer CRM', icon: Users },
    { id: 'inventory', label: 'Product & Inventory', icon: Package },
    { id: 'challans', label: 'Sales Challans', icon: FileText }
  ];

  const handleTabClick = (tabId: string) => {
    setTab(tabId);
    setMobileOpen(false); // Auto close sidebar on mobile tap
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 p-6">
      {/* Brand logo */}
      <div className="flex items-center space-x-3 mb-8 border-b border-slate-800 pb-6">
        <div className="h-9 w-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-50 tracking-tight">Apex ERP Portal</span>
          <p className="text-[10px] text-slate-400">v1.2 Operations Control</p>
        </div>
      </div>

      {/* User profile & Active Role Badge */}
      <div className="mb-8 p-4 bg-slate-950/40 rounded-xl border border-slate-800/40">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <span className="text-sm font-bold text-slate-200">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-200 truncate">{user.name}</h4>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        
        <div className={`mt-3 px-3 py-1.5 rounded-lg border flex items-center space-x-2 text-xs font-semibold ${badge.bg}`}>
          <BadgeIcon className="h-3.5 w-3.5" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sign Out triggers */}
      <div className="border-t border-slate-800 pt-6 mt-6 space-y-2">
        <a
          href="/project.zip"
          download="project.zip"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 text-slate-300 hover:text-indigo-400 bg-slate-800/40 hover:bg-slate-800/80 transition-all border border-slate-800/60"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Download Codebase ZIP</span>
        </a>

        <button
          onClick={onLogout}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center space-x-3 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, fixed width) */}
      <aside className="hidden lg:block w-72 h-screen shrink-0 border-r border-slate-200 fixed left-0 top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Absolute overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          {/* Drawer content */}
          <div className="relative w-80 max-w-sm h-full shadow-2xl">
            <button 
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
