import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const riskTier = searchParams.get('riskTier');
    const agingBucket = searchParams.get('agingBucket');
    const search = searchParams.get('search');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');

    // Build where clause
    const where: any = {
      orgId: user.orgId,
      status: {
        in: ['OPEN', 'PARTIAL'],
      },
    };

    if (riskTier) {
      where.riskTier = riskTier;
    }

    if (agingBucket) {
      where.agingBucket = agingBucket;
    }

    if (minAmount || maxAmount) {
      where.openAmount = {};
      if (minAmount) where.openAmount.gte = parseFloat(minAmount);
      if (maxAmount) where.openAmount.lte = parseFloat(maxAmount);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
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
        orgId: user.orgId,
        status: {
          in: ['OPEN', 'PARTIAL'],
        },
      },
    });

    const totalAR = allInvoices.reduce((sum: number, inv) => sum + inv.openAmount, 0);
    const totalOverdue = allInvoices
      .filter((inv) => inv.daysOverdue > 0)
      .reduce((sum: number, inv) => sum + inv.openAmount, 0);

    const agingBuckets = {
      CURRENT: allInvoices
        .filter((inv) => inv.agingBucket === 'CURRENT')
        .reduce((sum: number, inv) => sum + inv.openAmount, 0),
      DAYS_31_60: allInvoices
        .filter((inv) => inv.agingBucket === 'DAYS_31_60')
        .reduce((sum: number, inv) => sum + inv.openAmount, 0),
      DAYS_61_90: allInvoices
        .filter((inv) => inv.agingBucket === 'DAYS_61_90')
        .reduce((sum: number, inv) => sum + inv.openAmount, 0),
      OVER_90: allInvoices
        .filter((inv) => inv.agingBucket === 'OVER_90')
        .reduce((sum: number, inv) => sum + inv.openAmount, 0),
    };

    // Calculate estimated DSO
    const totalInvoiceAge = allInvoices.reduce((sum: number, inv) => {
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
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
