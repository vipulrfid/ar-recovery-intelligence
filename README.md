# AR Recovery Intelligence

A production-ready MVP for intelligent accounts receivable collections management. This multi-tenant B2B SaaS application helps finance teams optimize their collections process with prioritized worklists, automated email reminders, AI-assisted draft replies, and comprehensive KPIs.

## Features

### ✅ Implemented (High-Priority Modules)

- **Multi-tenant Authentication**: Secure login with NextAuth.js, role-based access (Admin/Member)
- **Dashboard Layout & Navigation**: Clean, professional UI with sidebar navigation
- **CSV Upload & Parsing**: Drag-and-drop CSV upload with validation and error reporting
- **Priority Scoring Engine**: ML-lite algorithm that scores invoices based on:
  - Days overdue (40% weight)
  - Open amount (30% weight)
  - Customer late rate (20% weight)
  - Open invoice count (10% weight)
- **Worklist Dashboard**: Prioritized invoice list with:
  - Real-time KPIs (Total AR, Total Overdue, Estimated DSO)
  - Aging bucket analysis (0-30, 31-60, 61-90, 90+ days)
  - Advanced filtering (risk tier, aging bucket, search)
  - Quick actions (mark paid, flag dispute, add notes)

### 🚧 Not Yet Implemented

- Email system (SMTP outbound + IMAP inbound)
- AI-powered intent classification and draft reply generation
- Draft inbox UI
- Lightweight rule engine
- Analytics page with export
- Invoice PDF attachments
- Promise-to-Pay tracking

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 7
- **Authentication**: NextAuth.js
- **Email**: Nodemailer (SMTP), imapflow (IMAP) - *not yet implemented*
- **AI**: OpenAI API - *not yet implemented*
- **Testing**: Vitest - *not yet implemented*

## Prerequisites

- Node.js 22+ (with pnpm)
- PostgreSQL 14+
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
cd /path/to/your/projects
# If you have the code, navigate to it
cd ar-recovery-intelligence
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up PostgreSQL

**Option A: Using System PostgreSQL (Recommended for Development)**

```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER ar_user WITH PASSWORD 'ar_password';"
sudo -u postgres psql -c "CREATE DATABASE ar_recovery OWNER ar_user;"
sudo -u postgres psql -c "ALTER USER ar_user CREATEDB;"
```

**Option B: Using Docker (if Docker is available)**

```bash
docker run -d \
  --name ar-recovery-db \
  -e POSTGRES_USER=ar_user \
  -e POSTGRES_PASSWORD=ar_password \
  -e POSTGRES_DB=ar_recovery \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Configure Environment Variables

The `.env` file should already be configured with:

```env
DATABASE_URL="postgresql://ar_user:ar_password@localhost:5432/ar_recovery?schema=public"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# OpenAI (optional, for future AI features)
OPENAI_API_KEY=

# Email (optional, for future email features)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

IMAP_HOST=
IMAP_PORT=993
IMAP_USER=
IMAP_PASSWORD=
```

**Important**: Change `NEXTAUTH_SECRET` in production:

```bash
# Generate a secure secret
openssl rand -base64 32
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

### 6. Seed the Database

```bash
npx tsx prisma/seed.ts
```

This creates:
- 1 organization (Acme Corporation)
- 2 users:
  - **Admin**: `admin@acme.com` / `admin123`
  - **Member**: `collector@acme.com` / `member123`
- 4 customers
- 6 invoices with varied statuses
- 3 email templates
- 1 default collection strategy with 5 rules

### 7. Start the Development Server

```bash
pnpm dev
```

The application will be available at: **http://localhost:3000**

### 8. Build for Production

```bash
pnpm build
pnpm start
```

## Usage Walkthrough

### 1. Login

Navigate to http://localhost:3000 and you'll be redirected to the login page.

Use the demo credentials:
- Email: `admin@acme.com`
- Password: `admin123`

### 2. View Dashboard

After login, you'll see the main dashboard with:
- **KPI Cards**: Total AR Open, Total Overdue, Estimated DSO, Open Invoices
- **Aging Analysis**: Breakdown by aging buckets
- **Worklist Table**: Prioritized list of invoices sorted by priority score

### 3. Filter Invoices

Use the filter controls to narrow down the worklist:
- **Search**: Filter by customer name or invoice number
- **Risk Tier**: Filter by Urgent, Follow Up, or Monitor
- **Aging Bucket**: Filter by aging period

### 4. Take Actions on Invoices

Click the "Actions" button on any invoice to:
- **Mark as Paid**: Update invoice status to paid
- **Flag Dispute**: Mark invoice as disputed (stops automation per rules)
- **Add Note**: Record a note about the invoice

### 5. Upload New Invoice Data

1. Navigate to **Upload Data** in the sidebar
2. Download the CSV template for reference
3. Drag and drop your CSV file or click to browse
4. Click "Upload and Process"
5. View the results (processed count, any errors)

The system will:
- Parse and validate the CSV
- Create or update customers
- Create or update invoices
- Calculate priority scores automatically
- Update customer statistics

### 6. CSV Format

**Required Columns:**
- `customer_name`
- `invoice_number`
- `invoice_date` (YYYY-MM-DD)
- `due_date` (YYYY-MM-DD)
- `invoice_amount` (numeric)
- `open_amount` (numeric)
- `status` (OPEN, PAID, PARTIAL, DISPUTED)

**Optional Columns:**
- `customer_email`
- `payment_terms` (days)
- `last_payment_date`
- `historical_avg_days_to_pay`
- `historical_late_rate` (0-1)

## Database Schema

The application uses a comprehensive schema with 15+ models:

- **Authentication**: `Org`, `User`
- **Core Data**: `Customer`, `Invoice`, `Upload`, `Activity`
- **Email System**: `EmailAccount`, `EmailThread`, `EmailMessage`, `EmailTemplate`
- **Rule Engine**: `Strategy`, `StrategyRule`
- **Collections**: `PromiseToPay`, `InvoiceDocument`

All models include `orgId` for multi-tenancy and data isolation.

## Priority Scoring Algorithm

The priority scoring engine uses a deterministic ML-lite formula:

```
score = (daysOverdue * 0.4) + (openAmount * 0.3) + (customerLateRate * 0.2) + (openInvoiceCount * 0.1)
```

Normalized to 0-100 scale.

**Risk Tiers:**
- **Urgent** (80-100): Requires immediate attention
- **Follow Up** (50-79): Should be contacted soon
- **Monitor** (<50): Low priority, monitor status

**Aging Buckets:**
- **Current**: 0-30 days
- **31-60 days**: Moderately overdue
- **61-90 days**: Significantly overdue
- **90+ days**: Severely overdue

## Project Structure

```
ar-recovery-intelligence/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth API routes
│   │   ├── dashboard/             # Dashboard data API
│   │   ├── invoices/[id]/         # Invoice actions API
│   │   └── upload/                # CSV upload API
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout with nav
│   │   └── page.tsx               # Main worklist dashboard
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── upload/
│   │   └── page.tsx               # CSV upload page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home (redirects to dashboard)
├── components/
│   ├── dashboard/
│   │   └── nav.tsx                # Sidebar navigation
│   └── providers/
│       └── session-provider.tsx   # NextAuth session provider
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── csv-parser.ts              # CSV parsing and validation
│   ├── prisma.ts                  # Prisma client singleton
│   ├── scoring.ts                 # Priority scoring engine
│   └── session.ts                 # Session utilities
├── prisma/
│   ├── migrations/                # Database migrations
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed data script
├── seed/
│   ├── invoice_template.csv       # CSV template
│   └── sample_invoices.csv        # Sample data
├── types/
│   └── next-auth.d.ts             # NextAuth type extensions
├── .env                           # Environment variables
├── middleware.ts                  # Route protection
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Future Enhancements

The following features are planned but not yet implemented:

1. **Email Integration**
   - SMTP outbound for automated reminders
   - IMAP inbound for receiving customer replies
   - Email threading and conversation tracking

2. **AI-Powered Features**
   - Intent classification for incoming emails
   - Automated draft reply generation
   - Promise-to-Pay extraction

3. **Rule Engine**
   - Customizable collection strategies
   - Conditional automation rules
   - Template selection logic

4. **Analytics & Reporting**
   - Cash recovered tracking
   - PTP pipeline visualization
   - CSV export functionality

5. **Enterprise Features**
   - ERP/CRM integrations
   - Contact enrichment
   - Advanced ML models
   - Cash application automation
   - Customer portal
   - Voice AI integration

## Troubleshooting

### Database Connection Issues

If you see "connection refused" errors:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Verify connection
psql -U ar_user -d ar_recovery -h localhost
```

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Or manually drop and recreate
sudo -u postgres psql -c "DROP DATABASE ar_recovery;"
sudo -u postgres psql -c "CREATE DATABASE ar_recovery OWNER ar_user;"
npx prisma migrate dev
```

### Build Errors

If the build fails:

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Rebuild
pnpm build
```

## Development

### Running Tests

```bash
# Not yet implemented
pnpm test
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name description_of_changes

# View database
psql -U ar_user -d ar_recovery -h localhost
```

## License

This is a demonstration MVP project. All rights reserved.

## Support

For questions or issues, please refer to the implementation plan document or contact the development team.
