/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  User, Customer, Product, StockMovement, Challan, FollowUpNote, DashboardStats 
} from './types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface Schema {
  users: User[];
  customers: Customer[];
  products: Product[];
  stockMovements: StockMovement[];
  challans: Challan[];
  followUpNotes: FollowUpNote[];
}

// Simple deterministic hash helper for seed passwords or secure validation (native crypto PBKDF2 style)
import * as crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DEFAULT_USERS: User[] = [
  { id: 'u1', email: 'admin@erp.com', name: 'Alok Sharma', role: 'Admin', password: hashPassword('admin') },
  { id: 'u2', email: 'sales@erp.com', name: 'Rohan Mehta', role: 'Sales', password: hashPassword('sales') },
  { id: 'u3', email: 'warehouse@erp.com', name: 'Sanjay Dutt', role: 'Warehouse', password: hashPassword('warehouse') },
  { id: 'u4', email: 'accounts@erp.com', name: 'Priya Iyer', role: 'Accounts', password: hashPassword('accounts') }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Rajesh Kumar',
    mobileNumber: '9876543210',
    email: 'rajesh@kumarenterprises.com',
    businessName: 'Kumar Enterprises',
    gstNumber: '27AAAAA1111A1Z1',
    customerType: 'Wholesale',
    address: '102, Industrial Area Phase II, Mumbai, Maharashtra',
    status: 'Active',
    followUpDate: '2026-07-25',
    notes: 'Premium distributor. Prefers bulk shipments of category A items.',
    createdAt: '2026-07-10T10:00:00.000Z'
  },
  {
    id: 'c2',
    name: 'Anjali Gupta',
    mobileNumber: '9123456789',
    email: 'anjali@guptaretails.com',
    businessName: 'Gupta Retail Stores',
    gstNumber: '27BBBBB2222B2Z2',
    customerType: 'Retail',
    address: 'Shop No. 4, Link Road, Andheri West, Mumbai',
    status: 'Active',
    followUpDate: '2026-07-28',
    notes: 'Regular retail customer. Orders weekly. Quick payer.',
    createdAt: '2026-07-12T14:30:00.000Z'
  },
  {
    id: 'c3',
    name: 'Vikram Singh',
    mobileNumber: '8888888888',
    email: 'vikram@singhdistributors.com',
    businessName: 'Singh Logistics & Distribution',
    gstNumber: '',
    customerType: 'Distributor',
    address: 'Plot 45, Sector 5, Gandhinagar, Gujarat',
    status: 'Lead',
    followUpDate: '2026-07-22',
    notes: 'Awaiting GST documentation. Intends to place a large initial order.',
    createdAt: '2026-07-15T09:15:00.000Z'
  },
  {
    id: 'c4',
    name: 'Meera Nair',
    mobileNumber: '7777666555',
    email: 'meera@nairandco.com',
    businessName: 'Nair Trading Company',
    gstNumber: '32CCCCC3333C3Z3',
    customerType: 'Wholesale',
    address: 'B-12, MG Road, Kochi, Kerala',
    status: 'Inactive',
    followUpDate: '2026-08-10',
    notes: 'On hold due to pending clearance of previous invoices.',
    createdAt: '2026-07-01T11:00:00.000Z'
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Wireless Headphones',
    sku: 'AUDIO-WH-300',
    category: 'Electronics',
    unitPrice: 4500,
    currentStock: 120,
    minimumStockAlertQuantity: 20,
    location: 'Warehouse A - Bin 14'
  },
  {
    id: 'p2',
    name: 'Ergonomic Mechanical Keyboard',
    sku: 'KEY-MECH-450',
    category: 'Computer Accessories',
    unitPrice: 3200,
    currentStock: 15,
    minimumStockAlertQuantity: 25, // Under minimum stock trigger!
    location: 'Warehouse A - Bin 08'
  },
  {
    id: 'p3',
    name: 'Ultra Wide Desktop Monitor 32"',
    sku: 'DISP-UW-32',
    category: 'Electronics',
    unitPrice: 18500,
    currentStock: 80,
    minimumStockAlertQuantity: 10,
    location: 'Warehouse B - Shelf 02'
  },
  {
    id: 'p4',
    name: 'Type-C Fast Charging Hub',
    sku: 'CHG-HUB-06',
    category: 'Accessories',
    unitPrice: 1200,
    currentStock: 350,
    minimumStockAlertQuantity: 50,
    location: 'Warehouse B - Bin 41'
  },
  {
    id: 'p5',
    name: 'Noise Cancelling Earbuds',
    sku: 'AUDIO-NC-50',
    category: 'Electronics',
    unitPrice: 2800,
    currentStock: 8,
    minimumStockAlertQuantity: 15, // Under minimum stock trigger!
    location: 'Warehouse A - Bin 15'
  }
];

const DEFAULT_MOVEMENTS: StockMovement[] = [
  {
    id: 'm1',
    productId: 'p1',
    productName: 'Premium Wireless Headphones',
    sku: 'AUDIO-WH-300',
    quantityChanged: 150,
    movementType: 'IN',
    reason: 'Initial stock intake from manufacturer',
    createdBy: 'u3',
    createdByName: 'Sanjay Dutt',
    timestamp: '2026-07-16T10:00:00.000Z'
  },
  {
    id: 'm2',
    productId: 'p2',
    productName: 'Ergonomic Mechanical Keyboard',
    sku: 'KEY-MECH-450',
    quantityChanged: 20,
    movementType: 'IN',
    reason: 'Purchase order receipt PO-402',
    createdBy: 'u3',
    createdByName: 'Sanjay Dutt',
    timestamp: '2026-07-17T11:30:00.000Z'
  },
  {
    id: 'm3',
    productId: 'p1',
    productName: 'Premium Wireless Headphones',
    sku: 'AUDIO-WH-300',
    quantityChanged: 30,
    movementType: 'OUT',
    reason: 'Sales order dispatch CH-20260718-001',
    createdBy: 'u3',
    createdByName: 'Sanjay Dutt',
    timestamp: '2026-07-18T16:45:00.000Z'
  }
];

const DEFAULT_CHALLANS: Challan[] = [
  {
    id: 'ch1',
    challanNumber: 'CH-20260718-001',
    customerId: 'c1',
    customerName: 'Rajesh Kumar',
    customerBusinessName: 'Kumar Enterprises',
    products: [
      {
        productId: 'p1',
        name: 'Premium Wireless Headphones',
        sku: 'AUDIO-WH-300',
        unitPrice: 4500,
        quantity: 30
      },
      {
        productId: 'p2',
        name: 'Ergonomic Mechanical Keyboard',
        sku: 'KEY-MECH-450',
        unitPrice: 3200,
        quantity: 5
      }
    ],
    totalQuantity: 35,
    totalAmount: 151000,
    status: 'Confirmed',
    createdBy: 'u2',
    createdByName: 'Rohan Mehta',
    createdDate: '2026-07-18'
  },
  {
    id: 'ch2',
    challanNumber: 'CH-20260720-002',
    customerId: 'c2',
    customerName: 'Anjali Gupta',
    customerBusinessName: 'Gupta Retail Stores',
    products: [
      {
        productId: 'p4',
        name: 'Type-C Fast Charging Hub',
        sku: 'CHG-HUB-06',
        unitPrice: 1200,
        quantity: 10
      }
    ],
    totalQuantity: 10,
    totalAmount: 12000,
    status: 'Draft',
    createdBy: 'u2',
    createdByName: 'Rohan Mehta',
    createdDate: '2026-07-20'
  }
];

const DEFAULT_NOTES: FollowUpNote[] = [
  {
    id: 'n1',
    customerId: 'c1',
    note: 'Spoke on phone. Customer requested immediate delivery of the headphones challan. Happy with the packing.',
    createdBy: 'u2',
    createdByName: 'Rohan Mehta',
    timestamp: '2026-07-18T17:00:00.000Z'
  },
  {
    id: 'n2',
    customerId: 'c3',
    note: 'Initial meeting held at corporate park. Handed over product catalog. They are wholesale buyers interested in display units.',
    createdBy: 'u2',
    createdByName: 'Rohan Mehta',
    timestamp: '2026-07-16T12:00:00.000Z'
  }
];

class JsonDatabase {
  private data: Schema;

  constructor() {
    this.data = {
      users: [],
      customers: [],
      products: [],
      stockMovements: [],
      challans: [],
      followUpNotes: []
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure all required sections exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.customers) this.data.customers = [];
        if (!this.data.products) this.data.products = [];
        if (!this.data.stockMovements) this.data.stockMovements = [];
        if (!this.data.challans) this.data.challans = [];
        if (!this.data.followUpNotes) this.data.followUpNotes = [];
      } else {
        // Seed database
        this.data = {
          users: DEFAULT_USERS,
          customers: DEFAULT_CUSTOMERS,
          products: DEFAULT_PRODUCTS,
          stockMovements: DEFAULT_MOVEMENTS,
          challans: DEFAULT_CHALLANS,
          followUpNotes: DEFAULT_NOTES
        };
        this.save();
      }
    } catch (e) {
      console.error('Failed to load JSON database, using in-memory or default seed', e);
      this.data = {
        users: DEFAULT_USERS,
        customers: DEFAULT_CUSTOMERS,
        products: DEFAULT_PRODUCTS,
        stockMovements: DEFAULT_MOVEMENTS,
        challans: DEFAULT_CHALLANS,
        followUpNotes: DEFAULT_NOTES
      };
    }
  }

  private save() {
    try {
      // Atomic write via temp file
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error writing to database file', e);
    }
  }

  // --- Common Helper ---
  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  // --- Customers ---
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id);
  }

  addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.data.customers.push(newCustomer);
    this.save();
    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const index = this.data.customers.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.data.customers[index] = {
      ...this.data.customers[index],
      ...updates,
      id // prevent ID overwrite
    };
    this.save();
    return this.data.customers[index];
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(product: Omit<Product, 'id' | 'currentStock'> & { currentStock?: number }, userId: string, userName: string): Product {
    const newProduct: Product = {
      ...product,
      id: this.generateId(),
      currentStock: product.currentStock || 0
    };
    this.data.products.push(newProduct);

    // Also trigger an initial stock movement log if stock > 0
    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: this.generateId(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        quantityChanged: newProduct.currentStock,
        movementType: 'IN',
        reason: 'Initial stock load on product registration',
        createdBy: userId,
        createdByName: userName,
        timestamp: new Date().toISOString()
      };
      this.data.stockMovements.push(movement);
    }

    this.save();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>, userId: string, userName: string, reasonOverride?: string): Product | undefined {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const oldProduct = this.data.products[index];
    const newProduct = {
      ...oldProduct,
      ...updates,
      id // prevent ID overwrite
    };

    // Calculate if current stock changed to log movement
    if (updates.currentStock !== undefined && updates.currentStock !== oldProduct.currentStock) {
      const difference = updates.currentStock - oldProduct.currentStock;
      if (difference !== 0) {
        const movement: StockMovement = {
          id: this.generateId(),
          productId: id,
          productName: newProduct.name,
          sku: newProduct.sku,
          quantityChanged: Math.abs(difference),
          movementType: difference > 0 ? 'IN' : 'OUT',
          reason: reasonOverride || `Manual stock adjustment from ${oldProduct.currentStock} to ${updates.currentStock}`,
          createdBy: userId,
          createdByName: userName,
          timestamp: new Date().toISOString()
        };
        this.data.stockMovements.push(movement);
      }
    }

    this.data.products[index] = newProduct;
    this.save();
    return newProduct;
  }

  // --- Stock Movements ---
  getStockMovements(): StockMovement[] {
    return this.data.stockMovements;
  }

  // --- Challans ---
  getChallans(): Challan[] {
    return this.data.challans;
  }

  getChallanById(id: string): Challan | undefined {
    return this.data.challans.find(ch => ch.id === id);
  }

  generateChallanNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = this.data.challans.filter(ch => ch.challanNumber.startsWith(`CH-${dateStr}`)).length + 1;
    const countStr = count.toString().padStart(3, '0');
    return `CH-${dateStr}-${countStr}`;
  }

  createChallan(challan: Omit<Challan, 'id' | 'challanNumber' | 'totalQuantity' | 'totalAmount' | 'customerName' | 'customerBusinessName' | 'createdDate'>): { challan?: Challan, error?: string } {
    const customer = this.getCustomerById(challan.customerId);
    if (!customer) {
      return { error: 'Customer not found' };
    }

    // Validate quantities and build snapshots
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of challan.products) {
      const p = this.getProductById(item.productId);
      if (!p) {
        return { error: `Product ID ${item.productId} not found` };
      }
      if (item.quantity <= 0) {
        return { error: `Quantity for product "${p.name}" must be greater than zero.` };
      }
      if (challan.status === 'Confirmed') {
        if (p.currentStock < item.quantity) {
          return { error: `Insufficient stock for product "${p.name}". Available: ${p.currentStock}, Requested: ${item.quantity}` };
        }
      }
      totalQuantity += item.quantity;
      totalAmount += item.unitPrice * item.quantity;
    }

    // Generate unique challan code
    const challanNumber = this.generateChallanNumber();

    const newChallan: Challan = {
      ...challan,
      id: this.generateId(),
      challanNumber,
      customerName: customer.name,
      customerBusinessName: customer.businessName,
      totalQuantity,
      totalAmount,
      createdDate: new Date().toISOString().split('T')[0]
    };

    // If confirmed, execute stock reduction and movement logging
    if (newChallan.status === 'Confirmed') {
      for (const item of newChallan.products) {
        const p = this.getProductById(item.productId)!;
        const finalStock = p.currentStock - item.quantity;
        this.updateProduct(
          p.id, 
          { currentStock: finalStock }, 
          newChallan.createdBy, 
          newChallan.createdByName, 
          `Stock deduction for confirmed challan ${challanNumber}`
        );
      }
    }

    this.data.challans.push(newChallan);
    this.save();
    return { challan: newChallan };
  }

  updateChallanStatus(id: string, newStatus: 'Confirmed' | 'Cancelled', userId: string, userName: string): { challan?: Challan, error?: string } {
    const challan = this.getChallanById(id);
    if (!challan) return { error: 'Challan not found' };

    if (challan.status === newStatus) {
      return { error: `Challan is already in status "${newStatus}"` };
    }

    if (challan.status === 'Confirmed' && (newStatus as string) === 'Draft') {
      return { error: 'Cannot revert a Confirmed challan to Draft' };
    }

    if (challan.status === 'Cancelled') {
      return { error: 'Cannot update status of a Cancelled challan' };
    }

    // Moving from Draft -> Confirmed
    if (challan.status === 'Draft' && newStatus === 'Confirmed') {
      // Validate stock for all products first
      for (const item of challan.products) {
        const p = this.getProductById(item.productId);
        if (!p) return { error: `Product "${item.name}" no longer exists.` };
        if (p.currentStock < item.quantity) {
          return { error: `Insufficient stock for product "${item.name}". Available: ${p.currentStock}, Requested: ${item.quantity}` };
        }
      }

      // Stock is sufficient, deduct stock and write movements
      for (const item of challan.products) {
        const p = this.getProductById(item.productId)!;
        const finalStock = p.currentStock - item.quantity;
        this.updateProduct(
          p.id, 
          { currentStock: finalStock }, 
          userId, 
          userName, 
          `Stock deduction for confirmed challan ${challan.challanNumber}`
        );
      }
    }

    // Moving from Confirmed -> Cancelled (restores stock)
    if (challan.status === 'Confirmed' && newStatus === 'Cancelled') {
      for (const item of challan.products) {
        const p = this.getProductById(item.productId);
        if (p) {
          const finalStock = p.currentStock + item.quantity;
          this.updateProduct(
            p.id, 
            { currentStock: finalStock }, 
            userId, 
            userName, 
            `Stock restoration for cancelled challan ${challan.challanNumber}`
          );
        }
      }
    }

    challan.status = newStatus;
    this.save();
    return { challan };
  }

  // --- Follow Up Notes ---
  getFollowUpNotesByCustomer(customerId: string): FollowUpNote[] {
    return this.data.followUpNotes
      .filter(n => n.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addFollowUpNote(customerId: string, noteText: string, userId: string, userName: string): FollowUpNote | undefined {
    const customer = this.getCustomerById(customerId);
    if (!customer) return undefined;

    const newNote: FollowUpNote = {
      id: this.generateId(),
      customerId,
      note: noteText,
      createdBy: userId,
      createdByName: userName,
      timestamp: new Date().toISOString()
    };

    this.data.followUpNotes.push(newNote);
    this.save();
    return newNote;
  }

  // --- General Statistics ---
  getDashboardStats(): DashboardStats {
    const customers = this.data.customers;
    const products = this.data.products;
    const challans = this.data.challans;

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.currentStock <= p.minimumStockAlertQuantity).length;
    const totalChallans = challans.length;
    const confirmedChallans = challans.filter(ch => ch.status === 'Confirmed').length;

    const totalChallanRevenue = challans
      .filter(ch => ch.status === 'Confirmed')
      .reduce((sum, ch) => sum + ch.totalAmount, 0);

    return {
      totalCustomers,
      activeCustomers,
      totalProducts,
      lowStockCount,
      totalChallans,
      confirmedChallans,
      totalChallanRevenue
    };
  }
}

export const db = new JsonDatabase();
export { hashPassword };
