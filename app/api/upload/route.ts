import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { parseInvoiceCSV } from '@/lib/csv-parser';
import { calculateDaysOverdue, scoreInvoice } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        orgId: user.orgId,
        fileName: file.name,
        status: 'PROCESSING',
      },
    });

    try {
      // Parse CSV
      const parseResult = parseInvoiceCSV(content);

      if (!parseResult.success) {
        await prisma.upload.update({
          where: { id: upload.id },
          data: {
            status: 'FAILED',
            errorSummary: `${parseResult.errors.length} validation errors found`,
          },
        });

        return NextResponse.json({
          success: false,
          errors: parseResult.errors,
          uploadId: upload.id,
        });
      }

      // Process each invoice
      let processedCount = 0;
      let skippedCount = 0;

      for (const invoiceData of parseResult.data) {
        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: {
            orgId: user.orgId,
            name: invoiceData.customerName,
          },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              orgId: user.orgId,
              name: invoiceData.customerName,
              primaryEmail: invoiceData.customerEmail,
              paymentTerms: invoiceData.paymentTerms,
              historicalAvgDaysToPay: invoiceData.historicalAvgDaysToPay,
              historicalLateRate: invoiceData.historicalLateRate,
              lastPaymentDate: invoiceData.lastPaymentDate,
            },
          });
        } else if (invoiceData.customerEmail && !customer.primaryEmail) {
          // Update customer email if not set
          await prisma.customer.update({
            where: { id: customer.id },
            data: { primaryEmail: invoiceData.customerEmail },
          });
        }

        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findUnique({
          where: {
            orgId_invoiceNumber: {
              orgId: user.orgId,
              invoiceNumber: invoiceData.invoiceNumber,
            },
          },
        });

        if (existingInvoice) {
          // Update existing invoice
          const daysOverdue = calculateDaysOverdue(invoiceData.dueDate);
          const scoring = scoreInvoice({
            daysOverdue,
            openAmount: invoiceData.openAmount,
            customerLateRate: customer.historicalLateRate ?? undefined,
            customerOpenInvoiceCount: customer.openInvoiceCount,
          });

          await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              invoiceDate: invoiceData.invoiceDate,
              dueDate: invoiceData.dueDate,
              invoiceAmount: invoiceData.invoiceAmount,
              openAmount: invoiceData.openAmount,
              status: invoiceData.status as any,
              daysOverdue,
              agingBucket: scoring.agingBucket,
              priorityScore: scoring.priorityScore,
              riskTier: scoring.riskTier,
            },
          });

          skippedCount++;
        } else {
          // Create new invoice
          const daysOverdue = calculateDaysOverdue(invoiceData.dueDate);
          const scoring = scoreInvoice({
            daysOverdue,
            openAmount: invoiceData.openAmount,
            customerLateRate: customer.historicalLateRate ?? undefined,
            customerOpenInvoiceCount: customer.openInvoiceCount,
          });

          await prisma.invoice.create({
            data: {
              orgId: user.orgId,
              customerId: customer.id,
              invoiceNumber: invoiceData.invoiceNumber,
              invoiceDate: invoiceData.invoiceDate,
              dueDate: invoiceData.dueDate,
              invoiceAmount: invoiceData.invoiceAmount,
              openAmount: invoiceData.openAmount,
              status: invoiceData.status as any,
              daysOverdue,
              agingBucket: scoring.agingBucket,
              priorityScore: scoring.priorityScore,
              riskTier: scoring.riskTier,
            },
          });

          processedCount++;
        }

        // Log activity
        await prisma.activity.create({
          data: {
            orgId: user.orgId,
            customerId: customer.id,
            type: 'INVOICE_UPLOADED',
            metadata: {
              invoiceNumber: invoiceData.invoiceNumber,
              uploadId: upload.id,
            },
          },
        });
      }

      // Update customer stats
      const customers = await prisma.customer.findMany({
        where: { orgId: user.orgId },
        include: { invoices: true },
      });

      for (const customer of customers) {
        const openInvoices = customer.invoices.filter(
          (inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL'
        );
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

      // Update upload status
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: 'COMPLETED' },
      });

      return NextResponse.json({
        success: true,
        uploadId: upload.id,
        processedCount,
        skippedCount,
        totalRows: parseResult.totalRows,
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          status: 'FAILED',
          errorSummary: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
