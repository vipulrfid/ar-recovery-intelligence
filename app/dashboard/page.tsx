'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [kpis, setKPIs] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskTierFilter, setRiskTierFilter] = useState('');
  const [agingBucketFilter, setAgingBucketFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (riskTierFilter) params.append('riskTier', riskTierFilter);
      if (agingBucketFilter) params.append('agingBucket', agingBucketFilter);

      const response = await fetch(`/api/dashboard?${params}`);
      const data = await response.json();
      setInvoices(data.invoices);
      setKPIs(data.kpis);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, riskTierFilter, agingBucketFilter]);

  const handleAction = async (invoiceId: string, action: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: actionNote }),
      });

      if (response.ok) {
        setSelectedInvoice(null);
        setActionNote('');
        fetchData();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(false);
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

  const getAgingBucketLabel = (bucket: string) => {
    switch (bucket) {
      case 'CURRENT':
        return '0-30 days';
      case 'DAYS_31_60':
        return '31-60 days';
      case 'DAYS_61_90':
        return '61-90 days';
      case 'OVER_90':
        return '90+ days';
      default:
        return bucket;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collect Today</h1>
        <p className="mt-1 text-sm text-gray-600">
          Prioritized worklist of invoices requiring attention
        </p>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
        <div className="bg-white shadow rounded-lg p-5 mb-6">
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

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Customer or invoice #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tier</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={riskTierFilter}
              onChange={(e) => setRiskTierFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="URGENT">Urgent</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="MONITOR">Monitor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aging Bucket</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={agingBucketFilter}
              onChange={(e) => setAgingBucketFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="CURRENT">0-30 days</option>
              <option value="DAYS_31_60">31-60 days</option>
              <option value="DAYS_61_90">61-90 days</option>
              <option value="OVER_90">90+ days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    {invoice.customer.disputeFlagged && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Disputed
                      </span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Actions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Modal */}
      {selectedInvoice && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedInvoice(null)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Invoice Actions - {selectedInvoice.invoiceNumber}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (optional)
                  </label>
                  <textarea
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    rows={3}
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAction(selectedInvoice.id, 'mark_paid')}
                    disabled={actionLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm disabled:opacity-50"
                  >
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => handleAction(selectedInvoice.id, 'flag_dispute')}
                    disabled={actionLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
                  >
                    Flag Dispute
                  </button>
                  <button
                    onClick={() => handleAction(selectedInvoice.id, 'add_note')}
                    disabled={actionLoading || !actionNote}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInvoice(null);
                      setActionNote('');
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
