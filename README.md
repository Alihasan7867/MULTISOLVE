# MULTISOLVE Enterprise Business Ecosystem

> **"Enter data once. Everything else happens automatically."**

MULTISOLVE is a unified business, accounting, inventory, and finance management platform designed for modern enterprises. It eliminates redundant data entry by interconnecting sales, purchases, inventory, double-entry bookkeeping, GST compliance, and predictive AI analytics into a single cohesive ecosystem.

---

## 🎨 Visual Design System & Palette

- **Primary Green Accent:** `#174D40`
- **Secondary Lime Highlight:** `#98E66B`
- **Page Background:** `#F5F5F5`
- **Card Background:** `#FFFFFF`
- **Primary Text:** `#171717`
- **Secondary Text:** `#929292`
- **Subtle Borders:** `#EAEAEA`
- **Success / Positive Trend:** `#98E66B`
- **Danger / Negative Trend:** `#F87171`

---

## 🚀 Key Modules & Automated Workflows

### 1. Sales & Invoicing Pipeline
- Generates GST-compliant tax invoices with CGST/SGST/IGST breakdown.
- **Automated Ecosystem Actions on Invoice Creation:**
  1. Validates warehouse product stock (prevents selling exceeding stock).
  2. Reduces product stock levels in real time.
  3. Records timestamped inventory movement audit trails.
  4. Updates customer receivable balances.
  5. Automatically posts balanced double-entry journal entries (Debit: Cash/Receivables, Credit: Revenue & Output GST).
  6. Generates tax records for GSTR-1 preparation.
  7. Refreshes sales targets, growth gauges, and dashboard KPIs.
- Built-in printable invoice viewer with PDF export.

### 2. Purchase & Procurement
- Records inward supplier bills.
- Increases product stock quantities automatically.
- Tracks vendor credit accounts payable and payment reconciliation.
- Automatically calculates input tax credit (ITC) for GSTR-3B deduction.

### 3. Inventory & Warehouse Management
- Real-time stock valuation based on cost price.
- Full stock movement audit trail (Product, Type, Quantity, Previous, Updated, Reference, Reason).
- Manual stock adjustment with reason tracking.
- Automated low-stock alerts and threshold notifications.

### 4. Double-Entry Accounting
- Standardized Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses).
- General ledger & journal entries with strict debit/credit balance validation.
- Balanced Trial Balance verification (Debits == Credits).
- Automated Profit & Loss Statement (Gross Revenue - COGS - Operating Expenses = Net Profit).
- Balance Sheet with retained earnings integration.

### 5. Indian GST & Tax Center
- Intra-state (CGST + SGST) vs Inter-state (IGST) support.
- GSTR-1 outward taxable supplies preparation register.
- GSTR-3B summary (Output GST liability minus eligible Input Tax Credit = Net Payable).
- Exportable CSV tax ledger.

### 6. Multi-Business Management
- Database-level isolation for managing multiple distinct business entities.
- Zero data leakage: independent customer lists, vendor directories, products, stock counts, and financial ledgers.
- Seamless context switching from top navigation bar.

### 7. Personal Finance Separation
- Dedicated personal finance space segregated from company balance sheets.
- Track personal drawings, monthly living expense categories, and SIP/investment buckets.
- Monthly budget caps with real-time visual progress bars.

### 8. AI & Automation Intelligence
- **Invoice OCR Parser:** Extracts document numbers, dates, GSTINs, and totals from scanned bills.
- **Smart Expense Categorizer:** Intelligent narration classification into ledger accounts.
- **Duplicate Detection:** Prevents accidental double-entry of invoices and bills.
- **Natural Language Financial Assistant:** Answers plain English queries about earnings, low stock, and debts.
- **Forward Cash Flow Projections:** 30-day and 60-day cash forecasting based on receivable due dates.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, React Router v7, Lucide Icons, Recharts, jsPDF.
- **Backend:** Node.js, Express, TypeScript, bcryptjs, jsonwebtoken.
- **Database & ORM:** Prisma ORM, SQLite (`dev.db`).
- **Security:** Bcrypt password hashing, JWT authentication, role-based access control, input validation.

---

## 🧪 Automated Integration Verification (23/23 PASSED)

Run the test suite:
```bash
npm --prefix server run tsx src/test-ecosystem.ts
```

Test Results Summary:
1. **User Authentication:** Registered, verified password hashing, protected routes.
2. **Product Persistence:** SKU unique constraint and field updating.
3. **Purchase Integration:** Stock of 20 + 10 units = 30 units (verified).
4. **Sales Integration:** Sale of 5 units = 25 units (verified).
5. **Insufficient Stock Rejection:** Attempting to sell 30 units when 25 available throws an error and leaves stock unchanged (verified).
6. **Expense Tracking:** Expense logged and ledger balance updated.
7. **Dashboard Computation:** Real-time computation of Sales, Purchases, Expenses, Valuation, Net Profit.
8. **Multi-Business Isolation:** Business 2 has 0 access to Business 1 records.
9. **Persistence:** Data survives across restarts and sessions.

---

## 🏃 Quick Start

### Default Demo Credentials
- **Email:** `admin@multisolve.com`
- **Password:** `admin123`

### Run Application
```bash
# Start backend server (serves both API & Frontend on port 5000)
npm --prefix server run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.
