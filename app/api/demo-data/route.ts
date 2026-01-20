import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the first organization (demo org)
    const org = await prisma.org.findFirst();

    if (!org) {
      return NextResponse.json(
        { error: 'No organization found. Please run seed script.' },
        { status: 404 }
      );
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: org.id,
        status: {
          in: ['OPEN', 'PARTIAL'],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            primaryEmail: true,
            disputeFlagged: true,
          },
        },
      },
      orderBy: {
        priorityScore: 'desc',
      },
      take: 100,
    });

    // Calculate KPIs
    const allInvoices = await prisma.invoice.findMany({
      where: {
        orgId: org.id,
        status: {
          in: ['OPEN', 'PARTIAL'],
        },
      },
    });

    const totalAR = allInvoices.reduce((sum, inv) => sum + inv.openAmount, 0);
    const totalOverdue = allInvoices
      .filter((inv) => inv.daysOverdue > 0)
      .reduce((sum, inv) => sum + inv.openAmount, 0);

    const agingBuckets = {
      CURRENT: allInvoices
        .filter((inv) => inv.agingBucket === 'CURRENT')
        .reduce((sum, inv) => sum + inv.openAmount, 0),
      DAYS_31_60: allInvoices
        .filter((inv) => inv.agingBucket === 'DAYS_31_60')
        .reduce((sum, inv) => sum + inv.openAmount, 0),
      DAYS_61_90: allInvoices
        .filter((inv) => inv.agingBucket === 'DAYS_61_90')
        .reduce((sum, inv) => sum + inv.openAmount, 0),
      OVER_90: allInvoices
        .filter((inv) => inv.agingBucket === 'OVER_90')
        .reduce((sum, inv) => sum + inv.openAmount, 0),
    };

    // Calculate estimated DSO
    const totalInvoiceAge = allInvoices.reduce((sum, inv) => {
      const invoiceAge = Math.floor(
        (new Date().getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + invoiceAge * inv.openAmount;
    }, 0);
    const estimatedDSO = totalAR > 0 ? Math.round(totalInvoiceAge / totalAR) : 0;

    return NextResponse.json({
      invoices,
      kpis: {
        totalAR,
        totalOverdue,
        agingBuckets,
        estimatedDSO,
        totalInvoices: allInvoices.length,
      },
    });
  } catch (error) {
    console.error('Demo data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch demo data' },
      { status: 500 }
    );
  }
}
