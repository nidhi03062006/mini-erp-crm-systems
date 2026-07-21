/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Challan, Customer, Product, UserRole, ChallanStatus, ChallanProductItem } from '../types';
import { 
  Plus, Search, Filter, ArrowLeft, Check, XCircle, Clock, FileText, ShoppingCart, Trash2, ShieldAlert, CheckCircle, Info 
} from 'lucide-react';

interface ChallansProps {
  userRole: UserRole;
}

interface NewChallanLine {
  productId: string;
  quantity: number;
}

export default function Challans({ userRole }: ChallansProps) {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Active Challan Detailed View
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Challan Creator Flow State
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorCustomerId, setCreatorCustomerId] = useState('');
  const [creatorLines, setCreatorLines] = useState<NewChallanLine[]>([{ productId: '', quantity: 1 }]);
  const [creatorStatus, setCreatorStatus] = useState<'Draft' | 'Confirmed'>('Draft');
  const [creatorError, setCreatorError] = useState<string | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(false);

  // Load Challans List
  const loadChallans = async () => {
    try {
      setLoading(true);
      let query = `/challans?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await api.get(query);
      setChallans(res.challans);
      setTotalPages(res.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales challans.');
    } finally {
      setLoading(false);
    }
  };

  // Load Customers & Products for Creator Dropdowns
  const loadDropdownData = async () => {
    try {
      const customersRes = await api.get('/customers?limit=100');
      const productsRes = await api.get('/products?limit=100');
      setCustomers(customersRes.customers);
      setProducts(productsRes.products);
    } catch (err) {
      console.error('Failed to load customers/products list for selector.', err);
    }
  };

  useEffect(() => {
    loadChallans();
  }, [page, statusFilter]);

  useEffect(() => {
    if (creatorOpen) {
      loadDropdownData();
    }
  }, [creatorOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadChallans();
  };

  // Change Challan Status (Confirm or Cancel)
  const updateStatus = async (challanId: string, status: 'Confirmed' | 'Cancelled') => {
    try {
      setTransitionLoading(true);
      setTransitionError(null);
      const updated = await api.put(`/challans/${challanId}/status`, { status });
      
      // Update states
      setSelectedChallan(updated);
      loadChallans();
    } catch (err: any) {
      setTransitionError(err.message || 'Status transition failed.');
    } finally {
      setTransitionLoading(false);
    }
  };

  // --- Creator Lines Helper Actions ---
  const addCreatorLine = () => {
    setCreatorLines(prev => [...prev, { productId: '', quantity: 1 }]);
  };

  const removeCreatorLine = (idx: number) => {
    if (creatorLines.length === 1) return;
    setCreatorLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLineProduct = (idx: number, productId: string) => {
    setCreatorLines(prev => {
      const copy = [...prev];
      copy[idx].productId = productId;
      return copy;
    });
  };

  const updateLineQty = (idx: number, qty: number) => {
    setCreatorLines(prev => {
      const copy = [...prev];
      copy[idx].quantity = Math.max(1, qty);
      return copy;
    });
  };

  // Calculate reactive totals in creator flow
  const calculateCreatorTotals = () => {
    let totalQty = 0;
    let totalAmt = 0;
    const linesValid = creatorLines.every(l => l.productId !== '');

    if (linesValid && products.length > 0) {
      for (const line of creatorLines) {
        const p = products.find(prod => prod.id === line.productId);
        if (p) {
          totalQty += line.quantity;
          totalAmt += p.unitPrice * line.quantity;
        }
      }
    }
    return { totalQty, totalAmt };
  };

  // Submit/Create Challan
  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorError(null);

    if (!creatorCustomerId) {
      setCreatorError('Please select a customer.');
      return;
    }

    const linesValid = creatorLines.every(l => l.productId !== '' && l.quantity > 0);
    if (!linesValid) {
      setCreatorError('Please select a product and enter a positive quantity for every line item.');
      return;
    }

    // Check duplicate products in lines
    const productIds = creatorLines.map(l => l.productId);
    const hasDuplicates = new Set(productIds).size !== productIds.length;
    if (hasDuplicates) {
      setCreatorError('Duplicate products found in line items. Please consolidate quantities into a single line item.');
      return;
    }

    try {
      setCreatorLoading(true);

      // Build snapshots from product objects
      const productsPayload: ChallanProductItem[] = creatorLines.map(line => {
        const p = products.find(prod => prod.id === line.productId)!;
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          unitPrice: p.unitPrice,
          quantity: line.quantity
        };
      });

      await api.post('/challans', {
        customerId: creatorCustomerId,
        products: productsPayload,
        status: creatorStatus
      });

      setCreatorOpen(false);
      loadChallans();
    } catch (err: any) {
      setCreatorError(err.message || 'Failed to submit sales challan.');
    } finally {
      setCreatorLoading(false);
    }
  };

  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const isSalesOrAdmin = ['Admin', 'Sales'].includes(userRole);
  const isWarehouse = userRole === 'Warehouse';
  const isAccounts = userRole === 'Accounts';

  const { totalQty: creatorTotalQty, totalAmt: creatorTotalAmt } = calculateCreatorTotals();

  return (
    <div className="space-y-6">
      
      {/* 1. Main List OR Detailed Inspector OR Creator Flow */}
      {creatorOpen ? (
        // A. SALES CHALLAN CREATOR INTERACTIVE FORM
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Generate Sales Challan</h2>
              <p className="text-xs text-slate-400 mt-0.5">Generate real-time outward delivery sheets with live stock validation.</p>
            </div>
            <button 
              onClick={() => setCreatorOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel &amp; Exit</span>
            </button>
          </div>

          {creatorError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 shrink-0" />
              <span>{creatorError}</span>
            </div>
          )}

          <form onSubmit={handleCreateChallan} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Build lines */}
            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Challan Line Items</span>
                <button
                  type="button"
                  onClick={addCreatorLine}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Dynamic lines list */}
              <div className="space-y-3">
                {creatorLines.map((line, idx) => {
                  const selectedProd = products.find(p => p.id === line.productId);
                  const isUnderStock = selectedProd && selectedProd.currentStock < line.quantity;
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-4 relative group">
                      
                      {/* Product Selector */}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product SKU *</label>
                        <select
                          required
                          value={line.productId}
                          onChange={(e) => updateLineProduct(idx, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                        >
                          <option value="">Select Product Code</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} [{p.sku}] - ({p.currentStock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Line input */}
                      <div className="w-24 shrink-0">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                        />
                      </div>

                      {/* Readonly Subtotal */}
                      <div className="w-28 shrink-0">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal (INR)</span>
                        <span className="block text-xs font-bold text-slate-800 py-1.5 pl-1.5">
                          {selectedProd ? formatINR(selectedProd.unitPrice * line.quantity) : '₹0'}
                        </span>
                      </div>

                      {/* Remove item trigger */}
                      {creatorLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCreatorLine(idx)}
                          className="md:mt-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-all shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Live Stock Alert Warning inside row */}
                      {isUnderStock && (
                        <div className="absolute -bottom-2 right-4 px-2 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-bold border border-red-100 flex items-center animate-pulse">
                          <ShieldAlert className="h-2.5 w-2.5 mr-1" />
                          Warehouse Shortage! Current Stock: {selectedProd.currentStock} units.
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column: Customer Selection & Submit Config */}
            <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
              
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Challan Summary</span>
                </div>

                {/* Customer Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dispatch Customer CRM Profile *</label>
                  <select
                    required
                    value={creatorCustomerId}
                    onChange={(e) => setCreatorCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                  >
                    <option value="">Select Wholesaler / Retailer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.businessName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live total stats display */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Total Quantity:</span>
                    <span className="text-slate-800">{creatorTotalQty} Units</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-800">
                    <span>Total Value:</span>
                    <span className="text-indigo-600 text-base">{formatINR(creatorTotalAmt)}</span>
                  </div>
                </div>

                {/* Save status config */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Challan Registration Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreatorStatus('Draft')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        creatorStatus === 'Draft'
                          ? 'bg-amber-50 border-amber-500 text-amber-700 font-extrabold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatorStatus('Confirmed')}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        creatorStatus === 'Confirmed'
                          ? 'bg-green-50 border-green-500 text-green-700 font-extrabold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Save &amp; Confirm
                    </button>
                  </div>
                  {creatorStatus === 'Confirmed' && (
                    <div className="mt-2 text-[10px] text-green-600 font-semibold flex items-center bg-green-50/50 p-2 rounded-lg border border-green-100">
                      <Info className="h-3.5 w-3.5 mr-1 shrink-0 text-green-600" />
                      <span>Saving as Confirmed immediately validates and reduces physical stock.</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatorLoading}
                className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10 disabled:bg-slate-300"
              >
                {creatorLoading ? 'Submitting Sales Challan...' : 'Confirm & Register Challan'}
              </button>

            </div>

          </form>

        </div>
      ) : selectedChallan ? (
        // B. DETAILED SALES CHALLAN SHEET INSPECTOR
        <div className="space-y-6 animate-fade-in">
          
          {/* Detailed sheet header tool */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <button 
              onClick={() => { setSelectedChallan(null); loadChallans(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors self-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Invoice Registry</span>
            </button>

            {/* Status indicators */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Challan Status:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                selectedChallan.status === 'Confirmed' ? 'bg-green-50 border-green-100 text-green-700' :
                selectedChallan.status === 'Draft' ? 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse' :
                'bg-red-50 border-red-100 text-red-700'
              }`}>
                {selectedChallan.status}
              </span>
            </div>
          </div>

          {transitionError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 shrink-0" />
              <span>{transitionError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Interactive invoice bill */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
              
              {/* Branding header in invoice format */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Apex Delivery Challan</h3>
                  <span className="text-xl font-mono font-extrabold text-slate-800 block mt-1">
                    {selectedChallan.challanNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Registration Date</span>
                  <span className="text-sm font-bold text-slate-700 block mt-0.5">{selectedChallan.createdDate}</span>
                </div>
              </div>

              {/* Customer detailed snapshot */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Shipped Client</span>
                  <span className="font-extrabold text-slate-800 block mt-1 text-sm">{selectedChallan.customerName}</span>
                  <span className="font-bold text-slate-500 block mt-0.5">{selectedChallan.customerBusinessName}</span>
                </div>
                <div className="md:border-l border-slate-200 md:pl-4">
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Created By Employee</span>
                  <span className="font-extrabold text-slate-800 block mt-1">{selectedChallan.createdByName}</span>
                  <span className="font-bold text-slate-500 block mt-0.5">ID: {selectedChallan.createdBy}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itemized Line Snapshot</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                        <th className="py-3 px-4">Product Name / Code</th>
                        <th className="py-3 px-4 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedChallan.products.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase mt-0.5">
                              SKU: {p.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(p.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">{p.quantity} Units</td>
                          <td className="py-3 px-4 text-right font-bold text-indigo-600">{formatINR(p.unitPrice * p.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals block */}
              <div className="flex justify-end pt-4 border-t border-slate-100 text-xs">
                <div className="w-64 space-y-3">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Cumulative Quantity:</span>
                    <span className="text-slate-800 font-extrabold">{selectedChallan.totalQuantity} Units</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-extrabold text-slate-800">
                    <span>Grand Total Invoice Value:</span>
                    <span className="text-indigo-600 text-base">{formatINR(selectedChallan.totalAmount)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Operational Status State Actions */}
            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Challan Operations Portal</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-800 block">Actions Guide</span>
                  <p>
                    - **Draft** state is fully mutable and can be converted into Confirmed when physical trucks are dispatched.
                  </p>
                  <p>
                    - **Confirmed** state immediately locks stock counts, records IN/OUT entries, and represents realized revenue.
                  </p>
                  <p>
                    - **Cancelled** state is an audit fallback. Cancelled inventory items are restored to the warehouse.
                  </p>
                </div>

                {/* State action buttons */}
                {selectedChallan.status === 'Draft' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorize Transition</span>
                    <button
                      onClick={() => updateStatus(selectedChallan.id, 'Confirmed')}
                      disabled={transitionLoading}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-600/10 flex items-center justify-center space-x-2"
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{transitionLoading ? 'Verifying stocks...' : 'Confirm & Deduct Stock'}</span>
                    </button>
                    <button
                      onClick={() => updateStatus(selectedChallan.id, 'Cancelled')}
                      disabled={transitionLoading}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-4 w-4 shrink-0 text-slate-500" />
                      <span>Cancel Challan</span>
                    </button>
                  </div>
                )}

                {selectedChallan.status === 'Confirmed' && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rollback Actions</span>
                    {isWarehouse ? (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-100 text-[11px] rounded-lg leading-relaxed">
                        Your warehouse role has insufficient permission to cancel a Confirmed challan. Please request an Admin, Sales, or Accounts agent.
                      </div>
                    ) : (
                      <button
                        onClick={() => updateStatus(selectedChallan.id, 'Cancelled')}
                        disabled={transitionLoading}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>{transitionLoading ? 'Restoring stock...' : 'Cancel Challan & Restore Stock'}</span>
                      </button>
                    )}
                  </div>
                )}

                {selectedChallan.status === 'Cancelled' && (
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-xs text-center font-bold">
                    This sales challan has been cancelled. Inventory was restored. No further state transitions are permitted.
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                All transactions are logged with digital operator signatures representing accountability.
              </div>

            </div>

          </div>

        </div>
      ) : (
        // C. INVOICE AND CHALLAN DIRECTORY TABLE LIST
        <div className="space-y-6 animate-fade-in">
          
          {/* List layout header tool */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sales Challan Sheets</h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor outward goods, approve pending shipping drafts, or execute rollback order cancellations.
              </p>
            </div>

            {isSalesOrAdmin && (
              <button 
                onClick={() => { setCreatorCustomerId(''); setCreatorLines([{ productId: '', quantity: 1 }]); setCreatorStatus('Draft'); setCreatorError(null); setCreatorOpen(true); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/15 transition-all self-start"
              >
                <Plus className="h-4 w-4" />
                <span>New Sales Challan</span>
              </button>
            )}
          </div>

          {/* Search bar & filter triggers */}
          <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
            
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Challan #, customer name, or business name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
              <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Challan Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-transparent border-none text-slate-700 focus:outline-none font-bold"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
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

          {/* Challans list table */}
          {loading ? (
            <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          ) : challans.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              No sales challans recorded in system matching filters.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="py-4 px-6">Challan # &amp; Date</th>
                      <th className="py-4 px-6">Customer CRM Link</th>
                      <th className="py-4 px-6 text-right">Items Dispatched</th>
                      <th className="py-4 px-6 text-right">Invoice value</th>
                      <th className="py-4 px-6">Status Badge</th>
                      <th className="py-4 px-6">Creator</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {challans.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-extrabold text-slate-800 text-sm block">{ch.challanNumber}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                            Date: {ch.createdDate}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-700 block">{ch.customerName}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                            {ch.customerBusinessName}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-slate-800 text-sm">
                            {ch.totalQuantity}
                          </span>
                          <span className="block text-[10px] text-slate-400">Lines: {ch.products.length}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-bold text-indigo-600 text-sm">
                            {formatINR(ch.totalAmount)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                            ch.status === 'Confirmed' ? 'bg-green-50 border-green-100 text-green-700' :
                            ch.status === 'Draft' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-red-50 border-red-100 text-red-700'
                          }`}>
                            {ch.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-700 block">{ch.createdByName}</span>
                          <span className="text-[10px] text-slate-400 block tracking-wider uppercase mt-0.5">
                            ID: {ch.createdBy}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => { setSelectedChallan(ch); setTransitionError(null); }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Inspect Sheet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

    </div>
  );
}
