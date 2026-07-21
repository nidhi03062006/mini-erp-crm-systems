/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Customer, CustomerType, CustomerStatus, UserRole, FollowUpNote } from '../types';
import { 
  Plus, Search, Filter, MessageSquare, Phone, Mail, Building, MapPin, Calendar, FileText, X, ArrowLeft, Edit, Users 
} from 'lucide-react';

interface CustomersProps {
  userRole: UserRole;
}

export default function Customers({ userRole }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Active Customer Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<FollowUpNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Forms Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formId, setFormId] = useState('');
  
  // Form Fields
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formType, setFormType] = useState<CustomerType>('Wholesale');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState<CustomerStatus>('Lead');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Customers List
  const loadCustomers = async () => {
    try {
      setLoading(true);
      let query = `/customers?page=${page}&limit=${limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (typeFilter) query += `&type=${typeFilter}`;

      const res = await api.get(query);
      setCustomers(res.customers);
      setTotalPages(res.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to pull customer profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, statusFilter, typeFilter, limit]);

  // Debounced/Triggered Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  // Fetch Single Customer Detail & Notes
  const viewCustomerDetail = async (customer: Customer) => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(res.customer);
      setSelectedNotes(res.followUpNotes);
    } catch (err: any) {
      setError('Could not fetch customer details.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Follow-Up Note
  const submitFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNoteText.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await api.post(`/customers/${selectedCustomer.id}/notes`, { note: newNoteText });
      
      // Prepend newly added note on screen instantly
      setSelectedNotes(prev => [res, ...prev]);
      setNewNoteText('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit follow-up notes.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Open Add Customer Form
  const openAddForm = () => {
    setEditMode(false);
    setFormId('');
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormBusiness('');
    setFormGst('');
    setFormType('Wholesale');
    setFormAddress('');
    setFormStatus('Lead');
    // Set follow up to tomorrow as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormFollowUp(tomorrow.toISOString().split('T')[0]);
    setFormNotes('');
    setFormError(null);
    setDrawerOpen(true);
  };

  // Open Edit Customer Form
  const openEditForm = (customer: Customer) => {
    setEditMode(true);
    setFormId(customer.id);
    setFormName(customer.name);
    setFormMobile(customer.mobileNumber);
    setFormEmail(customer.email);
    setFormBusiness(customer.businessName);
    setFormGst(customer.gstNumber || '');
    setFormType(customer.customerType);
    setFormAddress(customer.address);
    setFormStatus(customer.status);
    setFormFollowUp(customer.followUpDate);
    setFormNotes(customer.notes || '');
    setFormError(null);
    setDrawerOpen(true);
  };

  // Save/Submit Form
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName || !formMobile || !formEmail || !formBusiness || !formAddress || !formFollowUp) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const payload = {
        name: formName,
        mobileNumber: formMobile,
        email: formEmail,
        businessName: formBusiness,
        gstNumber: formGst,
        customerType: formType,
        address: formAddress,
        status: formStatus,
        followUpDate: formFollowUp,
        notes: formNotes
      };

      if (editMode) {
        const updated = await api.put(`/customers/${formId}`, payload);
        // If the updated customer is currently being viewed in detail, refresh state
        if (selectedCustomer && selectedCustomer.id === formId) {
          setSelectedCustomer(updated);
        }
      } else {
        await api.post('/customers', payload);
      }

      setDrawerOpen(false);
      loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving customer profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const isSalesOrAdmin = ['Admin', 'Sales'].includes(userRole);

  return (
    <div className="space-y-6">
      
      {/* 1. Main customers list OR Detailed view */}
      {selectedCustomer ? (
        // Detailed Customer view pane
        <div className="space-y-6 animate-fade-in">
          
          {/* Header toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <button 
              onClick={() => { setSelectedCustomer(null); loadCustomers(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors self-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to CRM Directory</span>
            </button>

            {isSalesOrAdmin && (
              <button 
                onClick={() => openEditForm(selectedCustomer)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all self-start shadow-md shadow-slate-900/10"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Modify Customer details</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Customer Info Card */}
            <div className="lg:col-span-5 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6">
              
              <div className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedCustomer.status === 'Active' ? 'bg-green-50 text-green-700' :
                    selectedCustomer.status === 'Lead' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedCustomer.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    {selectedCustomer.customerType} Account
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 mt-3">{selectedCustomer.name}</h2>
                <p className="text-xs text-slate-400 font-semibold flex items-center mt-1">
                  <Building className="h-3.5 w-3.5 mr-1" />
                  {selectedCustomer.businessName}
                </p>
              </div>

              {/* Core Attributes */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3 text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{selectedCustomer.mobileNumber}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-start space-x-3 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-xs">{selectedCustomer.address}</span>
                </div>
                {selectedCustomer.gstNumber && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">GST Registration</span>
                    <span className="font-mono font-bold text-slate-700 block mt-0.5">{selectedCustomer.gstNumber}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div className="flex items-center space-x-2 text-xs">
                  <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-slate-500">Scheduled Follow-up Date:</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedCustomer.followUpDate}
                  </span>
                </div>

                <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CRM Profile Notes</span>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{selectedCustomer.notes || 'No profile notes recorded.'}"
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Notes History Log */}
            <div className="lg:col-span-7 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between h-[500px]">
              
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Sales Follow-Up Notes Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chronological record of phone calls and interactions.</p>
              </div>

              {/* Scrolling list */}
              <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-4">
                {selectedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                    No customer interactions logged yet.
                  </div>
                ) : (
                  selectedNotes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span className="text-indigo-600 bg-indigo-50/40 px-2 py-0.5 rounded">By: {note.createdByName}</span>
                        <span>{new Date(note.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {note.note}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Note Submission Form */}
              {isSalesOrAdmin ? (
                <form onSubmit={submitFollowUpNote} className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                  <input
                    type="text"
                    required
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Log client call details or follow-up summary..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteText.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:bg-slate-300 flex items-center transition-all shadow-md shadow-indigo-600/10"
                  >
                    {submittingNote ? 'Saving...' : 'Add Log'}
                  </button>
                </form>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  Only members of Sales or Admin teams are authorized to append follow-up logs.
                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        // Standard profiles search list
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Customer CRM Profiles</h1>
              <p className="text-sm text-slate-500 mt-1">
                Maintain wholesaler registries, retailer classifications, and track upcoming review dates.
              </p>
            </div>

            {isSalesOrAdmin && (
              <button 
                onClick={openAddForm}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/15 transition-all self-start"
              >
                <Plus className="h-4 w-4" />
                <span>Register Customer</span>
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
                placeholder="Search by client name, business name, or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
              <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Type:</span>
                <select 
                  value={typeFilter} 
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="bg-transparent border-none text-slate-700 focus:outline-none font-bold"
                >
                  <option value="">All Types</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Retail">Retail</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>

              <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="bg-transparent border-none text-slate-700 focus:outline-none font-bold"
                >
                  <option value="">All Statuses</option>
                  <option value="Lead">Lead</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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

          {/* Customers data table */}
          {loading ? (
            <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-slate-300 mb-2" />
              No customer records match specified filter parameters.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="py-4 px-6">Client Name</th>
                      <th className="py-4 px-6">Business &amp; GST</th>
                      <th className="py-4 px-6">Contact Details</th>
                      <th className="py-4 px-6">Classification</th>
                      <th className="py-4 px-6">Follow-up Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block text-sm">{c.name}</span>
                          <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-50 border border-slate-100 text-slate-500">
                            ID: {c.id}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-700 block">{c.businessName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            GST: {c.gstNumber || 'Unregistered'}
                          </span>
                        </td>
                        <td className="py-4 px-6 space-y-0.5 text-slate-500 text-[11px]">
                          <span className="block font-semibold">{c.email}</span>
                          <span className="block font-semibold">{c.mobileNumber}</span>
                        </td>
                        <td className="py-4 px-6 space-y-1.5">
                          <span className="block text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full w-fit">
                            {c.customerType}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                            c.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' :
                            c.status === 'Lead' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {c.followUpDate}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => viewCustomerDetail(c)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Details &amp; Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination block */}
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

      {/* 2. Customer Drawer (Add/Edit) */}
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
                    {editMode ? 'Modify Customer Registry' : 'Register Customer Account'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Fill details securely to record profile metadata.</p>
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

              <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Client Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Business / Trade Name *</label>
                    <input
                      type="text"
                      required
                      value={formBusiness}
                      onChange={(e) => setFormBusiness(e.target.value)}
                      placeholder="e.g. Patel Brothers & Co"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      placeholder="e.g. 9812345670"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. contact@patel.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">GST Identification Number (Optional)</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value.toUpperCase())}
                    placeholder="e.g. 24AAAAA1111A1Z1"
                    maxLength={15}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Customer Type Classification *</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as CustomerType)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="Wholesale">Wholesale Buyers</option>
                      <option value="Retail">Retail Outlets</option>
                      <option value="Distributor">Primary Distributors</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Status classification *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as CustomerStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="Lead">Lead Account</option>
                      <option value="Active">Active Trader</option>
                      <option value="Inactive">Inactive/On hold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">Physical Registered Address *</label>
                  <textarea
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    rows={2}
                    placeholder="Provide full logistics and shipping dispatch address..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Next Planned Follow-up Review Date *</label>
                    <input
                      type="date"
                      required
                      value={formFollowUp}
                      onChange={(e) => setFormFollowUp(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {!editMode && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1.5">Initial Follow-up / Registering Notes</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      placeholder="Add brief details about initial meeting, call summary or purchase intents..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:bg-slate-300"
                >
                  {formLoading ? 'Saving customer details...' : 'Confirm customer details'}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
