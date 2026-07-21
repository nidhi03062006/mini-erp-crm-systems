# Mini ERP & CRM Operations Portal

An operational full-stack ERP and CRM enterprise portal designed for wholesale/distribution businesses.

This solution provides role-based access, customer registries, inventory catalogues, real-time stock-movement logging, and an interactive multi-line Sales Challan workflow with on-screen stock checks.

---

## 🚀 Key Features

1. **Role-Based Authentication (JWT)**:
   - Secured endpoints via HMAC-SHA256 signature checks.
   - Restricts operations based on department permissions (`Admin`, `Sales`, `Warehouse`, `Accounts`).
2. **Customer CRM Module**:
   - Register clients, classify as Retailers, Wholesalers, or Distributors.
   - Search profiles, record GST markers, schedule follow-up dates, and maintain chronological interaction logs.
3. **Product & Stock Catalogue**:
   - Track inventory units, unit costs, and storage bins.
   - Real-time **Low-Stock Visual Alarms** trigger when stocks drop below minimum threshold limits.
   - Comprehensive **Stock Movement Logging** automatically audits every stock inward (IN) or dispatch (OUT).
4. **Sales Challan Workflow**:
   - Interactive multi-line bill builder with reactive subtotals and Grand Total calculators.
   - Automatic, sequential challan number generator (`CH-YYYYMMDD-XXX`).
   - Strong **Stock Guard Business Logic**: saving or confirming a challan validates stock; fails with readable errors if quantities are insufficient, and automatically deducts stock and appends tracking logs upon successful confirmations.
   - Supports cancellations with automatic stock restorations!

---

## 👥 Interactive Review: Testing Credentials

To evaluate the application, use the quick login buttons on the sign-in page, or input these credentials manually:

| Team / Department | Email Address | Password | Operational Access / Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@erp.com` | `admin` | Global scope - full reading and writing privileges. |
| **Sales Division** | `sales@erp.com` | `sales` | Manage customer profiles, record call logs, and generate sales challan drafts. |
| **Logistics / Warehouse** | `warehouse@erp.com` | `warehouse` | Catalogue product specs, adjust stock counts (auto-logs adjustments), and inspect low stock markers. |
| **Accounts Department** | `accounts@erp.com` | `accounts` | Audit financial balances, approve/cancel sales challans, and monitor GST registries. |

---

## 🛠️ Technological Architecture

- **Frontend Environment**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend Environment**: Node.js + Express + tsx (for TypeScript compilation).
- **Database Layer**: Pure TypeScript, transaction-safe JSON file-based database (`db.json`) featuring atomic writes via temporary files. It is fast, cross-platform, immune to binary compilation errors, and pre-seeded with rich sample datasets.
- **Authentication**: Native Crypto-based HMAC-SHA256 JWT token signer and verifier.

---

## 📦 How to Setup and Run Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
1. Install base dependencies:
   ```bash
   npm install
   ```

2. Launch local Development environment:
   ```bash
   npm run dev
   ```
   *The server binds to `http://localhost:3000` handling both Vite static assets and API requests.*

3. Compiling and Starting in Production:
   ```bash
   npm run build
   npm start
   ```

---

## 📡 REST API Specifications

All API endpoints are prefixed with `/api`. Authenticated endpoints require a `Authorization: Bearer <JWT_TOKEN>` header.

### 🔐 Authentication
- **`POST /api/auth/login`**
  - Payload: `{ "email": "admin@erp.com", "password": "admin" }`
  - Response: JWT token string + User details block.
- **`GET /api/auth/me`**
  - Verification check of active token.

### 👥 Customer CRM
- **`GET /api/customers`**
  - Optional Filters: `search` (name, business, email), `status` (`Lead`\|`Active`\|`Inactive`), `type` (`Wholesale`\|`Retail`\|`Distributor`), `page` (default 1), `limit` (default 10).
- **`GET /api/customers/:id`**
  - Fetches the profile details plus all follow-up notes chronologically.
- **`POST /api/customers`** (Sales or Admin)
  - Creates a new wholesaler/retailer profile.
- **`PUT /api/customers/:id`** (Sales or Admin)
  - Updates profile metrics.
- **`POST /api/customers/:id/notes`** (Sales or Admin)
  - Appends an interaction/call log.

### 📦 Products & Stocks
- **`GET /api/products`**
  - Optional Filters: `search`, `category`, `page`, `limit`.
- **`POST /api/products`** (Warehouse or Admin)
  - Creates product. Triggers initial IN movement log if stock is loaded.
- **`PUT /api/products/:id`** (Warehouse or Admin)
  - Modifies product specs. Modifying current stock automatically appends an audit log specifying quantities changed, type (IN/OUT), and custom reasons.
- **`GET /api/stock-movements`**
  - Audited ledger list showing timestamps, product SKUs, quantities changed, direction, and operator names.

### 🧾 Sales Challans
- **`GET /api/challans`**
  - Filter by `search` (number, customer), `status`, `page`, `limit`.
- **`POST /api/challans`** (Sales or Admin)
  - Payload requires `customerId`, `products` (array of snapshot items), and `status` (`Draft`\|`Confirmed`).
  - Automatically handles out-of-stock validation if submitted as Confirmed.
- **`PUT /api/challans/:id/status`** (Sales, Accounts, Admin, or Warehouse)
  - Allows confirming or cancelling a draft sheet.
  - Automatically triggers stock reductions on confirmation and stock restorations on cancellations.

---

## 📌 Documented Assumptions & Decision Choices

- **Standalone DB Storage**: In the absence of an external Postgres cluster config, a custom transactional JSON file database was built. This provides robust file operations, allows automatic seeding, and is completely free of binary building problems.
- **Pre-Seeded Accounts**: Accounts are pre-seeded to provide immediate visual charts and graphs in the dashboard upon your first boot.
- **No Native Binary Dependecy**: Crypto HMAC JWT is chosen to guarantee cross-environment start-up speeds without native C++ compilation blockages.

---

## 📝 Submission Notes

- **GitHub repository link**: No remote is configured in this workspace yet.
  - To add a remote after creating a GitHub repo:
    ```bash
git remote add origin <your-repo-url>
git push -u origin main
```
- **Live frontend URL**: `http://localhost:3000`
- **Live backend API base URL**: `http://localhost:3000/api`
- **Test login credentials**:
  - Admin: `admin@erp.com` / `admin`
  - Sales: `sales@erp.com` / `sales`
  - Warehouse: `warehouse@erp.com` / `warehouse`
  - Accounts: `accounts@erp.com` / `accounts`
- **Postman collection**: `Mini_ERP_CRM_Postman_Collection.json`
- **Submission summary file**: `SUBMISSION.md`

This README now includes the key setup, deployment, and submission details for the project.

---

## ⚠️ Known Limitations

- Uses a local JSON file database (`db.json`) rather than a production-grade relational or NoSQL database.
- No environment-configurable database connection; data persistence depends on the file being writable on the host.
- The server bind port is fixed to `3000` and does not currently use `process.env.PORT` for deployment flexibility.
- No multi-instance scaling support; concurrent instances would not share state safely.
- Authentication relies on seeded credentials and a simple JWT implementation, not a full user registration or OAuth flow.
- No HTTPS or reverse-proxy setup is included by default; deployment should add secure transport separately.
