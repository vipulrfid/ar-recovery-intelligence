'use client';

import { useState } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface UploadResult {
  success: boolean;
  uploadId?: string;
  processedCount?: number;
  skippedCount?: number;
  totalRows?: number;
  errors?: Array<{ row: number; field?: string; message: string }>;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
      }
    } catch (error) {
      setResult({
        success: false,
        errors: [{ row: 0, message: 'Upload failed. Please try again.' }],
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `customer_name,customer_email,invoice_number,invoice_date,due_date,invoice_amount,open_amount,status,payment_terms,last_payment_date,historical_avg_days_to_pay,historical_late_rate
Acme Industries,ap@acmeindustries.com,INV-2026-001,2025-12-01,2026-01-01,12500.00,12500.00,OPEN,30,2025-11-15,28,0.10`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Invoice Data</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a CSV file containing invoice and customer data
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Download CSV Template
        </button>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              {file ? file.name : 'Drop your CSV file here, or click to browse'}
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">CSV files only</p>
      </div>

      {file && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'Processing...' : 'Upload and Process'}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6">
          {result.success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Upload successful</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Processed {result.processedCount} new invoices
                      {result.skippedCount && result.skippedCount > 0
                        ? `, updated ${result.skippedCount} existing invoices`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Upload failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {result.errors && result.errors.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {result.errors.slice(0, 10).map((error, idx) => (
                          <li key={idx}>
                            Row {error.row}
                            {error.field && ` (${error.field})`}: {error.message}
                          </li>
                        ))}
                        {result.errors.length > 10 && (
                          <li>... and {result.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    ) : (
                      <p>An unknown error occurred</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Required CSV Columns</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Required Fields:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>customer_name</li>
              <li>invoice_number</li>
              <li>invoice_date</li>
              <li>due_date</li>
              <li>invoice_amount</li>
              <li>open_amount</li>
              <li>status (OPEN, PAID, PARTIAL, DISPUTED)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Optional Fields:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>customer_email</li>
              <li>payment_terms</li>
              <li>last_payment_date</li>
              <li>historical_avg_days_to_pay</li>
              <li>historical_late_rate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
