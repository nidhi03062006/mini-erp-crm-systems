/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { DashboardStats, Product, UserRole } from '../types';
import { 
  Users, Package, FileText, IndianRupee, AlertTriangle, ArrowRight, TrendingUp, CheckCircle, Clock 
} from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  setTab: (tab: string) => void;
}

export default function Dashboard({ userRole, setTab }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load statistics
        const statsData = await api.get<DashboardStats>('/dashboard/stats');
        setStats(statsData);

        // Load products to filter for low stock lists
        const productsData = await api.get<{ products: Product[] }>('/products?limit=100');
        const lowStock = productsData.products.filter(p => p.currentStock <= p.minimumStockAlertQuantity);
        setLowStockProducts(lowStock);

        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to populate dashboard stats.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
        {error}
      </div>
    );
  }

  // Currency Formatter
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const statCards = [
    { 
      label: 'CRM Active Accounts', 
      val: stats?.activeCustomers ?? 0, 
      sub: `out of ${stats?.totalCustomers ?? 0} total profiles`, 
      icon: Users, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      action: 'View CRM',
      tab: 'customers'
    },
    { 
      label: 'Inventory Products', 
      val: stats?.totalProducts ?? 0, 
      sub: `${stats?.lowStockCount ?? 0} items under minimum limit`, 
      icon: Package, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      action: 'Adjust Stock',
      tab: 'inventory',
      warn: (stats?.lowStockCount ?? 0) > 0
    },
    { 
      label: 'Sales Challans', 
      val: stats?.totalChallans ?? 0, 
      sub: `${stats?.confirmedChallans ?? 0} confirmed transactions`, 
      icon: FileText, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50',
      action: 'Build Challan',
      tab: 'challans'
    },
    { 
      label: 'Confirmed Sales Revenue', 
      val: formatINR(stats?.totalChallanRevenue ?? 0), 
      sub: 'cumulative dispatched total', 
      icon: IndianRupee, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      action: 'Financials',
      tab: 'challans'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Operational Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time metrics, low-stock warnings, and quick-action portal triggers.
        </p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                  <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-2xl font-bold text-slate-800 tracking-tight">{card.val}</span>
                  {card.warn && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Alert
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{card.sub}</p>
              </div>
              <button 
                onClick={() => setTab(card.tab)}
                className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-indigo-600 group transition-colors"
              >
                <span>{card.action}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Main split grid: Warning alerts + Division guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Low Stock alerts - Warehouse priority */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Minimum Stock Re-order Warnings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Warehouse items that require immediate stock intake.</p>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${lowStockProducts.length > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {lowStockProducts.length} Items Alerted
            </span>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto max-h-80 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                <CheckCircle className="h-10 w-10 text-green-500/80 mb-2" />
                All warehouse stocks are within safe operating limits.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">SKU: {p.sku} | Location: {p.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-red-600">{p.currentStock} Units Left</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Alert limit: &le;{p.minimumStockAlertQuantity}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => setTab('inventory')}
            className="mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl text-center transition-all flex items-center justify-center"
          >
            Manage Warehouse Inventory
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </button>
        </div>

        {/* Right: Role-based Operations Guide & Quick Navigation */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Your Division Operations Checklist</h3>
            <p className="text-xs text-slate-400 mt-0.5">Authorized activities based on your assigned role.</p>
            
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Role Context</span>
                <span className="text-sm font-bold text-indigo-600 block mt-1">{userRole} Team Member</span>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {userRole === 'Admin' && 'You possess full authorization to view dashboards, create/modify customers, manage product catalogs, view inventory movement streams, and override sales challan statuses.'}
                  {userRole === 'Sales' && 'Authorized to register new customer CRM records, log sales conversation logs, generate sales challans as Drafts, and execute stock-reducing Confirmations.'}
                  {userRole === 'Warehouse' && 'Authorized to update physical stock quantities, register product SKU data, and inspect real-time re-order flags. Restricted from CRM or invoice modifications.'}
                  {userRole === 'Accounts' && 'Authorized to review, finalize, or cancel pending sales challan sheets, manage financial turnovers, and monitor tax registrations.'}
                </p>
              </div>

              {/* Action grid based on roles */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {['Admin', 'Sales'].includes(userRole) && (
                  <button 
                    onClick={() => setTab('customers')}
                    className="p-3 bg-indigo-50/30 hover:bg-indigo-50 border border-indigo-100/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-indigo-700 block">Create Customer</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">CRM registry</span>
                  </button>
                )}
                {['Admin', 'Sales'].includes(userRole) && (
                  <button 
                    onClick={() => setTab('challans')}
                    className="p-3 bg-rose-50/30 hover:bg-rose-50 border border-rose-100/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-rose-700 block">Build Challan</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Stock check</span>
                  </button>
                )}
                {['Admin', 'Warehouse'].includes(userRole) && (
                  <button 
                    onClick={() => setTab('inventory')}
                    className="p-3 bg-amber-50/30 hover:bg-amber-50 border border-amber-100/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-amber-700 block">Inward Stock</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Product catalog</span>
                  </button>
                )}
                {['Admin', 'Accounts'].includes(userRole) && (
                  <button 
                    onClick={() => setTab('challans')}
                    className="p-3 bg-emerald-50/30 hover:bg-emerald-50 border border-emerald-100/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-emerald-700 block">Confirm Revenue</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Invoice list</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl flex items-center space-x-2 text-[11px] text-slate-500 border border-slate-100">
            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Last database transaction synchronized seconds ago.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
