/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api, setAuthToken, setStoredUser } from '../utils/api';
import { LogIn, Key, Mail, Shield, ShoppingBag, Truck, CreditCard, Download } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      setAuthToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const triggerQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    // Submit using values directly to prevent state sync delay issues
    setError(null);
    setLoading(true);
    api.post('/auth/login', { email: roleEmail, password: rolePass })
      .then(data => {
        setAuthToken(data.token);
        setStoredUser(data.user);
        onLoginSuccess(data.user);
      })
      .catch((err: any) => {
        setError(err.message || 'Quick login failed.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const quickRoles = [
    { name: 'Admin', email: 'admin@erp.com', pass: 'admin', user: 'Alok Sharma', icon: Shield, color: 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100' },
    { name: 'Sales', email: 'sales@erp.com', pass: 'sales', user: 'Rohan Mehta', icon: ShoppingBag, color: 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100' },
    { name: 'Warehouse', email: 'warehouse@erp.com', pass: 'warehouse', user: 'Sanjay Dutt', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100' },
    { name: 'Accounts', email: 'accounts@erp.com', pass: 'accounts', user: 'Priya Iyer', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 md:p-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Left pane: Branding or context */}
        <div className="lg:col-span-5 bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-8 text-slate-50">
              Apex ERP
            </h1>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Wholesale distribution management, stock logs, customer CRM, and automated sales challan controls in a single unified portal.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-700/30">
              <p className="text-xs text-slate-400 mb-3">Need to review or host the codebase locally?</p>
              <a
                href="/project.zip"
                download="project.zip"
                className="inline-flex items-center space-x-2 bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all border border-indigo-500/30"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Codebase ZIP</span>
              </a>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0 text-slate-400 text-xs border-t border-slate-700/50 pt-6">
            © 2026 Apex Distribution Systems. All rights reserved.
          </div>
        </div>

        {/* Right pane: Standard login + Quick demo fill */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold text-slate-800">
              Portal Sign In
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Provide credentials to securely access your division dashboard.
            </p>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@erp.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/15 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-slate-950/10 hover:shadow-slate-950/25 transition-all mt-6"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Sign In Securely
                    <LogIn className="ml-2 h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Quick Demo Access Trigger Block */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Interactive Review: One-Click Quick Login
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickRoles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => triggerQuickFill(role.email, role.pass)}
                      className={`p-3 text-left border rounded-xl flex flex-col justify-between transition-all ${role.color}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold uppercase tracking-wider">{role.name}</span>
                        <Icon className="h-4 w-4 opacity-80" />
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-semibold text-slate-800 truncate">{role.user}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Password: {role.pass}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
