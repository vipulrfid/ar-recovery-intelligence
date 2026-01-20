import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create organization
  const org = await prisma.org.create({
    data: {
      name: 'Acme Corporation',
      timezone: 'America/New_York',
      defaultPaymentLinkUrl: 'https://pay.acme.com',
      defaultTone: 'polite',
      emailAutoSendEnabled: false,
      stopAutomationOnDispute: true,
    },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      orgId: org.id,
    },
  });

  console.log(`✅ Created admin user: ${admin.email}`);

  // Create member user
  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.create({
    data: {
      email: 'collector@acme.com',
      name: 'Collections Agent',
      passwordHash: memberPassword,
      role: 'MEMBER',
      orgId: org.id,
    },
  });

  console.log(`✅ Created member user: ${member.email}`);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: 'TechStart Inc',
        primaryEmail: 'ap@techstart.com',
        paymentTerms: 30,
        historicalAvgDaysToPay: 35,
        historicalLateRate: 0.25,
      },
    }),
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: 'Global Retail Co',
        primaryEmail: 'billing@globalretail.com',
        paymentTerms: 45,
        historicalAvgDaysToPay: 42,
        historicalLateRate: 0.15,
      },
    }),
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: 'Manufacturing Solutions LLC',
        primaryEmail: 'finance@mfgsolutions.com',
        paymentTerms: 60,
        historicalAvgDaysToPay: 75,
        historicalLateRate: 0.45,
      },
    }),
    prisma.customer.create({
      data: {
        orgId: org.id,
        name: 'Quick Pay Services',
        primaryEmail: 'accounts@quickpay.com',
        paymentTerms: 15,
        historicalAvgDaysToPay: 12,
        historicalLateRate: 0.05,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create invoices with varied statuses
  const today = new Date();
  const invoices = await Promise.all([
    // TechStart Inc - 45 days overdue
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[0].id,
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
        invoiceAmount: 15000,
        openAmount: 15000,
        status: 'OPEN',
        daysOverdue: 45,
        agingBucket: 'DAYS_31_60',
        priorityScore: 75,
        riskTier: 'FOLLOW_UP',
      },
    }),
    // TechStart Inc - 15 days overdue
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[0].id,
        invoiceNumber: 'INV-2024-002',
        invoiceDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        invoiceAmount: 8500,
        openAmount: 8500,
        status: 'OPEN',
        daysOverdue: 15,
        agingBucket: 'CURRENT',
        priorityScore: 55,
        riskTier: 'FOLLOW_UP',
      },
    }),
    // Global Retail Co - 95 days overdue (URGENT)
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[1].id,
        invoiceNumber: 'INV-2024-003',
        invoiceDate: new Date(today.getTime() - 140 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000),
        invoiceAmount: 42000,
        openAmount: 42000,
        status: 'OPEN',
        daysOverdue: 95,
        agingBucket: 'OVER_90',
        priorityScore: 92,
        riskTier: 'URGENT',
      },
    }),
    // Manufacturing Solutions - 120 days overdue, DISPUTED
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[2].id,
        invoiceNumber: 'INV-2024-004',
        invoiceDate: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000),
        invoiceAmount: 28000,
        openAmount: 28000,
        status: 'DISPUTED',
        daysOverdue: 120,
        agingBucket: 'OVER_90',
        priorityScore: 88,
        riskTier: 'URGENT',
        disputeFlagged: true,
      },
    }),
    // Quick Pay Services - Due in 5 days
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[3].id,
        invoiceNumber: 'INV-2024-005',
        invoiceDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        invoiceAmount: 5200,
        openAmount: 5200,
        status: 'OPEN',
        daysOverdue: 0,
        agingBucket: 'CURRENT',
        priorityScore: 25,
        riskTier: 'MONITOR',
      },
    }),
    // Quick Pay Services - PAID
    prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[3].id,
        invoiceNumber: 'INV-2024-006',
        invoiceDate: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000),
        dueDate: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000),
        invoiceAmount: 3800,
        openAmount: 0,
        status: 'PAID',
        daysOverdue: 0,
        agingBucket: 'CURRENT',
        priorityScore: 0,
        riskTier: 'MONITOR',
      },
    }),
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  // Update customer stats
  for (const customer of customers) {
    const customerInvoices = invoices.filter((inv) => inv.customerId === customer.id);
    const openInvoices = customerInvoices.filter((inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL');
    const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + inv.openAmount, 0);
    const totalOverdueAmount = openInvoices
      .filter((inv) => inv.daysOverdue > 0)
      .reduce((sum, inv) => sum + inv.openAmount, 0);

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOpenAmount,
        totalOverdueAmount,
        openInvoiceCount: openInvoices.length,
      },
    });
  }

  console.log(`✅ Updated customer stats`);

  // Create email templates
  const templates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        orgId: org.id,
        key: 'due_soon',
        subjectTemplate: 'Reminder: Invoice {{invoice_number}} due in {{days_until_due}} days',
        bodyTemplate: `Dear {{customer_name}},

This is a friendly reminder that the following invoice(s) will be due soon:

{{invoice_list}}

Total Amount Due: {{total_open_amount}}

Please ensure payment is made by the due date. You can make a payment here: {{payment_link}}

If you have any questions or have already made payment, please let us know.

Thank you for your business!

Best regards,
Accounts Receivable Team`,
        tone: 'polite',
      },
    }),
    prisma.emailTemplate.create({
      data: {
        orgId: org.id,
        key: 'past_due',
        subjectTemplate: 'Past Due: Invoice {{invoice_number}} - Action Required',
        bodyTemplate: `Dear {{customer_name}},

Our records indicate that the following invoice(s) are now past due:

{{invoice_list}}

Total Amount Overdue: {{total_open_amount}}

Please remit payment immediately to avoid any service interruptions. You can make a payment here: {{payment_link}}

If you have already sent payment or have questions about this invoice, please contact us right away.

Thank you for your prompt attention to this matter.

Sincerely,
Accounts Receivable Team`,
        tone: 'firm',
      },
    }),
    prisma.emailTemplate.create({
      data: {
        orgId: org.id,
        key: 'final_notice',
        subjectTemplate: 'FINAL NOTICE: Invoice {{invoice_number}} - Immediate Action Required',
        bodyTemplate: `Dear {{customer_name}},

This is a FINAL NOTICE regarding the following severely overdue invoice(s):

{{invoice_list}}

Total Amount Overdue: {{total_open_amount}}

Payment is now {{days_overdue}} days past due. We must receive payment within 7 days to avoid further collection actions.

Please make payment immediately: {{payment_link}}

If there are any issues preventing payment, please contact us immediately to discuss payment arrangements.

This is an urgent matter requiring your immediate attention.

Accounts Receivable Team`,
        tone: 'final',
      },
    }),
  ]);

  console.log(`✅ Created ${templates.length} email templates`);

  // Create default strategy with rules
  const strategy = await prisma.strategy.create({
    data: {
      orgId: org.id,
      name: 'Default Collection Strategy',
      enabled: true,
      priority: 0,
    },
  });

  const rules = await Promise.all([
    prisma.strategyRule.create({
      data: {
        orgId: org.id,
        strategyId: strategy.id,
        priority: 1,
        conditionsJson: [{ field: 'disputeFlagged', operator: 'equals', value: true }],
        actionsJson: [{ type: 'stopAutomation', value: true }],
      },
    }),
    prisma.strategyRule.create({
      data: {
        orgId: org.id,
        strategyId: strategy.id,
        priority: 2,
        conditionsJson: [
          { field: 'hasPromiseToPay', operator: 'equals', value: true },
          { field: 'promisedDateInFuture', operator: 'equals', value: true },
        ],
        actionsJson: [{ type: 'stopAutomation', value: true }],
      },
    }),
    prisma.strategyRule.create({
      data: {
        orgId: org.id,
        strategyId: strategy.id,
        priority: 3,
        conditionsJson: [{ field: 'daysOverdue', operator: 'gte', value: 30 }],
        actionsJson: [
          { type: 'templateKey', value: 'final_notice' },
          { type: 'nextFollowUpDays', value: 7 },
        ],
      },
    }),
    prisma.strategyRule.create({
      data: {
        orgId: org.id,
        strategyId: strategy.id,
        priority: 4,
        conditionsJson: [{ field: 'daysOverdue', operator: 'gte', value: 1 }],
        actionsJson: [
          { type: 'templateKey', value: 'past_due' },
          { type: 'nextFollowUpDays', value: 7 },
        ],
      },
    }),
    prisma.strategyRule.create({
      data: {
        orgId: org.id,
        strategyId: strategy.id,
        priority: 5,
        conditionsJson: [{ field: 'daysUntilDue', operator: 'lte', value: 7 }],
        actionsJson: [
          { type: 'templateKey', value: 'due_soon' },
          { type: 'nextFollowUpDays', value: 3 },
        ],
      },
    }),
  ]);

  console.log(`✅ Created strategy with ${rules.length} rules`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Organization: ${org.name}`);
  console.log(`   - Users: 2 (admin@acme.com / admin123, collector@acme.com / member123)`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Invoices: ${invoices.length}`);
  console.log(`   - Email Templates: ${templates.length}`);
  console.log(`   - Strategy Rules: ${rules.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
