import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action, note } = body;
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!invoice || invoice.orgId !== user.orgId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    switch (action) {
      case 'mark_paid':
        await prisma.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            openAmount: 0,
            daysOverdue: 0,
            priorityScore: 0,
            riskTier: 'MONITOR',
          },
        });

        await prisma.activity.create({
          data: {
            orgId: user.orgId,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
            type: 'PAYMENT_RECORDED',
            metadata: { note },
          },
        });
        break;

      case 'flag_dispute':
        await prisma.invoice.update({
          where: { id },
          data: { disputeFlagged: true, status: 'DISPUTED' },
        });

        await prisma.customer.update({
          where: { id: invoice.customerId },
          data: { disputeFlagged: true },
        });

        await prisma.activity.create({
          data: {
            orgId: user.orgId,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
            type: 'DISPUTE_FLAGGED',
            metadata: { note },
          },
        });
        break;

      case 'add_note':
        await prisma.activity.create({
          data: {
            orgId: user.orgId,
            customerId: invoice.customerId,
            invoiceId: invoice.id,
            type: 'NOTE_ADDED',
            metadata: { note },
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Recalculate customer stats
    const customerInvoices = await prisma.invoice.findMany({
      where: { customerId: invoice.customerId },
    });

    const openInvoices = customerInvoices.filter(
      (inv) => inv.status === 'OPEN' || inv.status === 'PARTIAL'
    );
    const totalOpenAmount = openInvoices.reduce((sum, inv) => sum + inv.openAmount, 0);
    const totalOverdueAmount = openInvoices
      .filter((inv) => inv.daysOverdue > 0)
      .reduce((sum, inv) => sum + inv.openAmount, 0);

    await prisma.customer.update({
      where: { id: invoice.customerId },
      data: {
        totalOpenAmount,
        totalOverdueAmount,
        openInvoiceCount: openInvoices.length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    );
  }
}
