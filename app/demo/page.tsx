'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  openAmount: number;
  status: string;
  daysOverdue: number;
  agingBucket: string;
  priorityScore: number;
  riskTier: string;
  customer: {
    id: string;
    name: string;
    primaryEmail?: string;
    disputeFlagged: boolean;
  };
}

interface KPIs {
  totalAR: number;
  totalOverdue: number;
  agingBuckets: {
    CURRENT: number;
    DAYS_31_60: number;
    DAYS_61_90: number;
    OVER_90: number;
  };
  estimatedDSO: number;
  totalInvoices: number;
}

export default function DemoPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [kpis, setKPIs] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/demo-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setInvoices(data.invoices);
      setKPIs(data.kpis);
    } catch (error) {
      console.error('Failed to fetch demo data:', error);
      setError('Failed to load demo data. Please check the server logs.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskTierColor = (tier: string) => {
    switch (tier) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'FOLLOW_UP':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AR Recovery Intelligence - Demo</h1>
          <p className="mt-2 text-sm text-gray-600">
            Production-ready MVP for intelligent accounts receivable collections management
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading demo data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            {kpis && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total AR Open</dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {formatCurrency(kpis.totalAR)}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Overdue</dt>
                        <dd className="mt-1 text-2xl font-semibold text-red-600">
                          {formatCurrency(kpis.totalOverdue)}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">Estimated DSO</dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {kpis.estimatedDSO} days
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">Open Invoices</dt>
                        <dd className="mt-1 text-2xl font-semibold text-gray-900">
                          {kpis.totalInvoices}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aging Buckets */}
            {kpis && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aging Analysis</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">0-30 days</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(kpis.agingBuckets.CURRENT)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">31-60 days</div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {formatCurrency(kpis.agingBuckets.DAYS_31_60)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">61-90 days</div>
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(kpis.agingBuckets.DAYS_61_90)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">90+ days</div>
                    <div className="text-lg font-semibold text-red-600">
                      {formatCurrency(kpis.agingBuckets.OVER_90)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Prioritized Invoice Worklist</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Invoices sorted by priority score (highest to lowest)
                </p>
              </div>
              {invoices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No invoices found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Overdue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.priorityScore}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{invoice.customer.name}</div>
                            {invoice.customer.primaryEmail && (
                              <div className="text-sm text-gray-500">{invoice.customer.primaryEmail}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.openAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${
                                invoice.daysOverdue > 0 ? 'text-red-600' : 'text-gray-900'
                              }`}
                            >
                              {invoice.daysOverdue}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskTierColor(
                                invoice.riskTier
                              )}`}
                            >
                              {invoice.riskTier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Feature Info */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Demo Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Priority scoring engine with ML-lite algorithm</li>
                <li>Real-time KPIs and aging analysis</li>
                <li>Multi-tenant architecture with data isolation</li>
                <li>CSV upload and parsing (available in full version)</li>
                <li>Quick actions: Mark paid, flag disputes, add notes (available in full version)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
