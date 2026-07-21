/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string; // SKU/code
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStockAlertQuantity: number;
  location: string; // Warehouse/location
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string; // cached for UI convenience
  sku: string; // cached
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdBy: string; // userId
  createdByName: string; // username
  timestamp: string;
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanProductItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  products: ChallanProductItem[];
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string; // userId
  createdByName: string;
  createdDate: string; // YYYY-MM-DD
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdByName: string;
  timestamp: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  confirmedChallans: number;
  totalChallanRevenue: number;
}
