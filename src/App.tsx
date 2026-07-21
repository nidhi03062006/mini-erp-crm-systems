/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getStoredUser, clearAuthToken, api } from './utils/api';
import { UserRole } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import Challans from './components/Challans';
import { Menu, Shield } from 'lucide-react';

interface UserState {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export default function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [currentTab, setTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Load user from localStorage or query backend to verify
  useEffect(() => {
    async function verifySession() {
      const stored = getStoredUser();
      if (stored) {
        try {
          // Quick session verify against backend
          const res = await api.get('/auth/me');
          setUser(res.user);
        } catch (e) {
          // Token expired or invalid
          clearAuthToken();
          setUser(null);
        }
      }
      setCheckingAuth(false);
    }
    verifySession();
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setTab('dashboard');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard userRole={user.role} setTab={setTab} />;
      case 'customers':
        return <Customers userRole={user.role} />;
      case 'inventory':
        return <Inventory userRole={user.role} />;
      case 'challans':
        return <Challans userRole={user.role} />;
      default:
        return <Dashboard userRole={user.role} setTab={setTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* Sidebar (Desktop left pane, mobile overlay) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        
        {/* Mobile top action header (sticky/fixed layout) */}
        <header className="lg:hidden h-16 bg-slate-900 text-slate-100 flex items-center justify-between px-6 border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Apex ERP Portal</span>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="h-9 w-9 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content body padding wrapper */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-6">
          {renderActiveTab()}
        </main>
      </div>

    </div>
  );
}
