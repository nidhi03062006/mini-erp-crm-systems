/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Product, StockMovement, UserRole, MovementType } from '../types';
import { 
  Plus, Search, Filter, AlertTriangle, ArrowUpDown, Package, MapPin, ClipboardList, Info, X, Edit 
} from 'lucide-react';

interface InventoryProps {
  userRole: UserRole;
}

export default function Inventory({ userRole }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active view tab (Products list vs Stock Movement logs)
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'logs'>('catalog');

  // Product Catalog search/filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);

  // Stock Movement logs search/filters
  const [logProductId, setLogProductId] = useState('');
  const [logMovementType, setLogMovementType] = useState<MovementType | ''>('');
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  // Forms Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formId, setFormId] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUnitPrice, setFormUnitPrice] = useState<number>(0);
  const [formCurrentStock, setFormCurrentStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(0);
  const [formLocation, setFormLocation] = useState('');
  const [formReason, setFormReason] = useState(''); // Only shown on edit stock

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load Catalog Products
  const loadProducts = async () => {
    try {
      setLoading(true);
      let query = `/products?page=${catalogPage}&limit=10`;
      if (catalogSearch) query += `&search=${encodeURIComponent(catalogSearch)}`;
      if (catalogCategory) query += `&category=${catalogCategory}`;

      const res = await api.get(query);
      setProducts(res.products);
      setCatalogTotalPages(res.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Load Stock Movements Logs
  const loadMovements = async () => {
    try {
      setMovementsLoading(true);
      let query = `/stock-movements?page=${logPage}&limit=10`;
      if (logProductId) query += `&productId=${logProductId}`;
      if (logMovementType) query += `&movementType=${logMovementType}`;

      const res = await api.get(query);
      setMovements(res.movements);
      setLogTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to pull stock movement streams', err);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'catalog') {
      loadProducts();
    } else {
      loadMovements();
    }
  }, [activeSubTab, catalogPage, catalogCategory, logPage, logProductId, logMovementType]);

  const handleCatalogSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCatalogPage(1);
    loadProducts();
  };

  // Open Add Product form
  const openAddForm = () => {
    setEditMode(false);
    setFormId('');
    setFormName('');
    setFormSku('');
    setFormCategory('');
    setFormUnitPrice(0);
    setFormCurrentStock(0);
    setFormMinStock(10);
    setFormLocation('');
    setFormReason('');
    setFormError(null);
    setDrawerOpen(true);
  };

  // Open Edit Product form
  const openEditForm = (p: Product) => {
    setEditMode(true);
    setFormId(p.id);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormUnitPrice(p.unitPrice);
    setFormCurrentStock(p.currentStock);
    setFormMinStock(p.minimumStockAlertQuantity);
    setFormLocation(p.location);
    setFormReason('Manual warehouse physical stock check adjustment');
    setFormError(null);
    setDrawerOpen(true);
  };

  // Handle Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formSku || !formCategory || formUnitPrice < 0 || formMinStock < 0 || !formLocation) {
      setFormError('Please fill in all required fields with valid values.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        name: formName,
        sku: formSku,
        category: formCategory,
        unitPrice: Number(formUnitPrice),
        currentStock: Number(formCurrentStock),
        minimumStockAlertQuantity: Number(formMinStock),
        location: formLocation
      };

      if (editMode) {
        // We can pass stock adjustment reason on edit
        const editPayload = {
          ...payload,
          reason: formReason
        };
        await api.put(`/products/${formId}`, editPayload);
      } else {
        await api.post('/products', payload);
      }

      setDrawerOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving product details.');
    } finally {
      setFormLoading(false);
    }
  };

  const isWarehouseOrAdmin = ['Admin', 'Warehouse'].includes(userRole);

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product &amp; Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain product catalog detail, view stocks, track bin locations, and audit real-time log movements.
          </p>
        </div>

        {isWarehouseOrAdmin && activeSubTab === 'catalog' && (
          <button 
            onClick={openAddForm}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/15 transition-all self-start"
          >
            <Plus className="h-4 w-4" />
            <span>Register Product</span>
          </button>
        )}
      </div>

      {/* Sub tabs: Catalog list vs Stock Movement logs */}
      <div className="flex space-x-1.5 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'catalog' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Package className="h-4 w-4" />
            <span>Product Catalog</span>
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'logs' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <ClipboardList className="h-4 w-4" />
            <span>Stock Movement Stream</span>
          </span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'catalog' ? (
        // 1. PRODUCT CATALOG VIEW
        <div className="space-y-6">
          {/* Search bar & filter triggers */}
          <form onSubmit={handleCatalogSearchSubmit} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
            
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search by product name or SKU/code..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
              <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Category:</span>
                <select 
                  value={catalogCategory} 
                  onChange={(e) => { setCatalogCategory(e.target.value); setCatalogPage(1); }}
                  className="bg-transparent border-none text-slate-700 focus:outline-none font-bold"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Computer Accessories">Computer Accessories</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <button 
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-xl shrink-0 transition-colors"
              >
                Apply Filters
              </button>
            </div>

          </form>

          {/* Catalog list table */}
          {loading ? (
            <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center justify-center">
              <Package className="h-10 w-10 text-slate-300 mb-2" />
              No products found in catalog matching filters.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="py-4 px-6">Product &amp; SKU</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Unit Price</th>
                      <th className="py-4 px-6">Stock Status</th>
                      <th className="py-4 px-6">Bin Location</th>
                      {isWarehouseOrAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {products.map((p) => {
                      const isLowStock = p.currentStock <= p.minimumStockAlertQuantity;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 block text-sm">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5 font-bold uppercase">
                              SKU: {p.sku}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-500 font-bold bg-slate-100/55 px-2.5 py-1 rounded-full text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 text-sm">
                              {formatINR(p.unitPrice)}
                            </span>
                          </td>
                          <td className="py-4 px-6 space-y-1.5">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                                {p.currentStock} Units
                              </span>
                              {isLowStock && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-red-50 text-red-700 animate-pulse border border-red-100">
                                  <AlertTriangle className="h-2 w-2 mr-0.5 shrink-0" />
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-400 font-semibold">
                              Min limit: {p.minimumStockAlertQuantity} units
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-semibold">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{p.location}</span>
                            </div>
                          </td>
                          {isWarehouseOrAdmin && (
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => openEditForm(p)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ml-auto"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Adjust Stock</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {catalogTotalPages > 1 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Page {catalogPage} of {catalogTotalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={catalogPage === 1}
                      onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    <button
                      disabled={catalogPage === catalogTotalPages}
                      onClick={() => setCatalogPage(p => Math.min(catalogTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // 2. STOCK MOVEMENT LOGS STREAM VIEW
        <div className="space-y-6 animate-fade-in">
          
          {/* Movement quick filters */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Flow Type:</span>
                <select 
                  value={logMovementType} 
                  onChange={(e) => { setLogMovementType(e.target.value as MovementType | ''); setLogPage(1); }}
                  className="bg-transparent border-none text-slate-700 focus:outline-none font-bold"
                >
                  <option value="">All Streams</option>
                  <option value="IN">Stock Inward (IN)</option>
                  <option value="OUT">Stock Dispatch (OUT)</option>
                </select>
              </div>

              {/* Show warning context info */}
              <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
                <Info className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Logs auto-generated upon purchase receipts, challan completions, or cancellations.</span>
              </div>
            </div>

            <button 
              onClick={() => { setLogMovementType(''); setLogPage(1); loadMovements(); }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Sync Log Stream
            </button>
          </div>

          {/* Movements Timeline Table */}
          {movementsLoading ? (
            <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : movements.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center justify-center">
              <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
              No stock movement logs recorded in this filter stream.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Product Details</th>
                      <th className="py-4 px-6">Qty Shifted</th>
                      <th className="py-4 px-6">Friction/Reason</th>
                      <th className="py-4 px-6">Registered By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 text-[11px] text-slate-400">
                          {new Date(m.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block text-sm">{m.productName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5 font-bold uppercase">
                            SKU: {m.sku}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center ${
                            m.movementType === 'IN' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged} Units
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-slate-600 leading-relaxed text-xs max-w-xs block italic">
                            "{m.reason}"
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-700 block">{m.createdByName}</span>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider mt-0.5">
                            ID: {m.createdBy}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logTotalPages > 1 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Page {logPage} of {logTotalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={logPage === 1}
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    <button
                      disabled={logPage === logTotalPages}
                      onClick={() => setLogPage(p => Math.min(logTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product Add/Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          {/* Content Pane */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-in p-6 z-10 overflow-y-auto">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editMode ? 'Adjust Product Stock' : 'Register Product SKU'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Input warehouse inventory metadata safely.</p>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">Product Display Name *</label>
                  <input
                    type="text"
                    required
                    disabled={editMode}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dell XPS 15 Laptop"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">SKU / Code *</label>
                    <input
                      type="text"
                      required
                      disabled={editMode}
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                      placeholder="e.g. COMP-XPS-15"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Category *</label>
                    <select
                      value={formCategory}
                      disabled={editMode}
                      onChange={(e) => setFormCategory(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Computer Accessories">Computer Accessories</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Unit Price (INR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Current Stock *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Min Stock Limit *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(Number(e.target.value))}
                      placeholder="5"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">Warehouse Location / Bin *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Warehouse A - Bin 14"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                {editMode && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Stock Adjustment Reason Override *</label>
                    <textarea
                      required
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      rows={2}
                      placeholder="Log reason for editing stock counts manually (e.g. physical count verify, damages)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 italic"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:bg-slate-300"
                >
                  {formLoading ? 'Saving product details...' : 'Confirm product details'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
