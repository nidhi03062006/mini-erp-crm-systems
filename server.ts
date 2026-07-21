/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './src/db';
import { signToken, verifyToken } from './src/auth';
import { UserRole } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Authentication Middlewares ---
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired authorization token' });
    return;
  }

  req.user = decoded as AuthenticatedRequest['user'];
  next();
}

function requireRoles(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
}

// --- REST API ENDPOINTS ---

// 1. Auth Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user || user.password !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Generate token containing roles
  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Get current user profile (for checking login state)
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// 2. Customers CRM Endpoints
app.get('/api/customers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, type, page = '1', limit = '10' } = req.query;

    let customers = db.getCustomers();

    // Filtering
    if (search) {
      const q = (search as string).toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.businessName.toLowerCase().includes(q) ||
        c.mobileNumber.includes(q)
      );
    }

    if (status) {
      customers = customers.filter(c => c.status === status);
    }

    if (type) {
      customers = customers.filter(c => c.customerType === type);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const totalCount = customers.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Sort newer first
    customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginatedCustomers = customers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      customers: paginatedCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
});

app.get('/api/customers/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  const followUpNotes = db.getFollowUpNotesByCustomer(customer.id);
  res.json({ customer, followUpNotes });
});

app.post('/api/customers', requireAuth, requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { name, mobileNumber, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

  // Simple validations
  if (!name || !mobileNumber || !email || !businessName || !customerType || !address || !status || !followUpDate) {
    res.status(400).json({ error: 'Missing required customer field(s)' });
    return;
  }

  const newCustomer = db.addCustomer({
    name,
    mobileNumber,
    email,
    businessName,
    gstNumber: gstNumber || '',
    customerType,
    address,
    status,
    followUpDate,
    notes: notes || ''
  });

  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', requireAuth, requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { name, mobileNumber, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

  const existing = db.getCustomerById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const updated = db.updateCustomer(req.params.id, {
    name,
    mobileNumber,
    email,
    businessName,
    gstNumber: gstNumber || '',
    customerType,
    address,
    status,
    followUpDate,
    notes: notes || ''
  });

  res.json(updated);
});

// Follow up notes routes
app.post('/api/customers/:id/notes', requireAuth, requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { note } = req.body;
  if (!note || note.trim() === '') {
    res.status(400).json({ error: 'Note text is required' });
    return;
  }

  const updatedNote = db.addFollowUpNote(req.params.id, note, req.user!.id, req.user!.name);
  if (!updatedNote) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  res.status(201).json(updatedNote);
});

// 3. Products Endpoints
app.get('/api/products', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, page = '1', limit = '10' } = req.query;

    let products = db.getProducts();

    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    if (category) {
      products = products.filter(p => p.category === category);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const totalCount = products.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    const paginatedProducts = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      products: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product);
});

app.post('/api/products', requireAuth, requireRoles(['Admin', 'Warehouse']), (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, category, unitPrice, currentStock, minimumStockAlertQuantity, location } = req.body;

  if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined || minimumStockAlertQuantity === undefined || !location) {
    res.status(400).json({ error: 'Missing required product field(s)' });
    return;
  }

  // Check unique SKU
  const existing = db.getProducts().find(p => p.sku.toLowerCase() === sku.toLowerCase());
  if (existing) {
    res.status(400).json({ error: `Product SKU "${sku}" already exists.` });
    return;
  }

  const newProduct = db.addProduct({
    name,
    sku,
    category,
    unitPrice: Number(unitPrice),
    minimumStockAlertQuantity: Number(minimumStockAlertQuantity),
    location,
    currentStock: Number(currentStock)
  }, req.user!.id, req.user!.name);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAuth, requireRoles(['Admin', 'Warehouse']), (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, category, unitPrice, currentStock, minimumStockAlertQuantity, location } = req.body;

  const existing = db.getProductById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Check unique SKU if SKU changed
  if (sku && sku.toLowerCase() !== existing.sku.toLowerCase()) {
    const skuExists = db.getProducts().find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (skuExists) {
      res.status(400).json({ error: `Product SKU "${sku}" is already in use.` });
      return;
    }
  }

  const updated = db.updateProduct(req.params.id, {
    name,
    sku,
    category,
    unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
    currentStock: currentStock !== undefined ? Number(currentStock) : undefined,
    minimumStockAlertQuantity: minimumStockAlertQuantity !== undefined ? Number(minimumStockAlertQuantity) : undefined,
    location
  }, req.user!.id, req.user!.name);

  res.json(updated);
});

// Stock movements retrieval
app.get('/api/stock-movements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, movementType, page = '1', limit = '10' } = req.query;

    let movements = db.getStockMovements();

    if (productId) {
      movements = movements.filter(m => m.productId === productId);
    }

    if (movementType) {
      movements = movements.filter(m => m.movementType === movementType);
    }

    // Sort newer first
    movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const totalCount = movements.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    const paginatedMovements = movements.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      movements: paginatedMovements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch stock movements' });
  }
});

// 4. Challans Endpoints
app.get('/api/challans', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, page = '1', limit = '10' } = req.query;

    let challans = db.getChallans();

    if (search) {
      const q = (search as string).toLowerCase();
      challans = challans.filter(ch => 
        ch.challanNumber.toLowerCase().includes(q) || 
        ch.customerName.toLowerCase().includes(q) ||
        ch.customerBusinessName.toLowerCase().includes(q)
      );
    }

    if (status) {
      challans = challans.filter(ch => ch.status === status);
    }

    // Sort newer first
    challans.sort((a, b) => b.challanNumber.localeCompare(a.challanNumber));

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const totalCount = challans.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    const paginatedChallans = challans.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      challans: paginatedChallans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch challans' });
  }
});

app.get('/api/challans/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const challan = db.getChallanById(req.params.id);
  if (!challan) {
    res.status(404).json({ error: 'Challan not found' });
    return;
  }
  res.json(challan);
});

app.post('/api/challans', requireAuth, requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { customerId, products, status } = req.body;

  if (!customerId || !products || !Array.isArray(products) || products.length === 0 || !status) {
    res.status(400).json({ error: 'Missing customer, products list or status' });
    return;
  }

  const result = db.createChallan({
    customerId,
    products,
    status,
    createdBy: req.user!.id,
    createdByName: req.user!.name
  });

  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json(result.challan);
});

app.put('/api/challans/:id/status', requireAuth, requireRoles(['Admin', 'Sales', 'Warehouse', 'Accounts']), (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;

  if (!status || (status !== 'Confirmed' && status !== 'Cancelled')) {
    res.status(400).json({ error: 'Valid status update is required (Confirmed or Cancelled)' });
    return;
  }

  // Double check authorization depending on role
  // Accounts can confirm/cancel, Sales can confirm/cancel, Warehouse can confirm, Admin can do all
  const userRole = req.user!.role;
  if (userRole === 'Warehouse' && status === 'Cancelled') {
    res.status(403).json({ error: 'Warehouse role is not authorized to cancel challans.' });
    return;
  }

  const result = db.updateChallanStatus(req.params.id, status, req.user!.id, req.user!.name);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json(result.challan);
});

// 5. Dashboard Statistics
app.get('/api/dashboard/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard stats' });
  }
});


// 6. Project Download Route (Serves the compiled codebase zip)
app.get('/project.zip', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'project.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="project.zip"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Project zip file not found or still generating. Please try again in a few moments.');
  }
});


// --- VITE MIDDLEWARE SETUP & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ERP Portal] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
