import Papa from 'papaparse';
import { z } from 'zod';

const invoiceRowSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  invoice_amount: z.string().min(1, 'Invoice amount is required'),
  open_amount: z.string().min(1, 'Open amount is required'),
  status: z.string().min(1, 'Status is required'),
  customer_email: z.string().optional(),
  payment_terms: z.string().optional(),
  last_payment_date: z.string().optional(),
  historical_avg_days_to_pay: z.string().optional(),
  historical_late_rate: z.string().optional(),
});

export type InvoiceRow = z.infer<typeof invoiceRowSchema>;

export interface ParsedInvoice {
  customerName: string;
  customerEmail?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  invoiceAmount: number;
  openAmount: number;
  status: string;
  paymentTerms?: number;
  lastPaymentDate?: Date;
  historicalAvgDaysToPay?: number;
  historicalLateRate?: number;
}

export interface ParseError {
  row: number;
  field?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  data: ParsedInvoice[];
  errors: ParseError[];
  totalRows: number;
}

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseNumber(numStr: string): number | null {
  const num = parseFloat(numStr.replace(/[,$]/g, ''));
  return isNaN(num) ? null : num;
}

export function parseInvoiceCSV(csvContent: string): ParseResult {
  const errors: ParseError[] = [];
  const data: ParsedInvoice[] = [];

  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach((error) => {
      errors.push({
        row: error.row || 0,
        message: error.message,
      });
    });
  }

  parseResult.data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and we skip header

    // Validate required fields
    const validation = invoiceRowSchema.safeParse(row);
    if (!validation.success) {
      validation.error.issues.forEach((err) => {
        errors.push({
          row: rowNumber,
          field: err.path[0]?.toString(),
          message: err.message,
        });
      });
      return;
    }

    const validRow = validation.data;

    // Parse dates
    const invoiceDate = parseDate(validRow.invoice_date);
    const dueDate = parseDate(validRow.due_date);

    if (!invoiceDate) {
      errors.push({
        row: rowNumber,
        field: 'invoice_date',
        message: 'Invalid date format',
      });
      return;
    }

    if (!dueDate) {
      errors.push({
        row: rowNumber,
        field: 'due_date',
        message: 'Invalid date format',
      });
      return;
    }

    // Parse amounts
    const invoiceAmount = parseNumber(validRow.invoice_amount);
    const openAmount = parseNumber(validRow.open_amount);

    if (invoiceAmount === null) {
      errors.push({
        row: rowNumber,
        field: 'invoice_amount',
        message: 'Invalid amount format',
      });
      return;
    }

    if (openAmount === null) {
      errors.push({
        row: rowNumber,
        field: 'open_amount',
        message: 'Invalid amount format',
      });
      return;
    }

    // Validate status
    const validStatuses = ['OPEN', 'PAID', 'PARTIAL', 'DISPUTED'];
    const status = validRow.status.toUpperCase();
    if (!validStatuses.includes(status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Parse optional fields
    const paymentTerms = validRow.payment_terms ? parseNumber(validRow.payment_terms) : undefined;
    const lastPaymentDate = validRow.last_payment_date ? parseDate(validRow.last_payment_date) : undefined;
    const historicalAvgDaysToPay = validRow.historical_avg_days_to_pay
      ? parseNumber(validRow.historical_avg_days_to_pay)
      : undefined;
    const historicalLateRate = validRow.historical_late_rate
      ? parseNumber(validRow.historical_late_rate)
      : undefined;

    data.push({
      customerName: validRow.customer_name,
      customerEmail: validRow.customer_email || undefined,
      invoiceNumber: validRow.invoice_number,
      invoiceDate,
      dueDate,
      invoiceAmount,
      openAmount,
      status,
      paymentTerms: paymentTerms ?? undefined,
      lastPaymentDate: lastPaymentDate ?? undefined,
      historicalAvgDaysToPay: historicalAvgDaysToPay ?? undefined,
      historicalLateRate: historicalLateRate ?? undefined,
    });
  });

  return {
    success: errors.length === 0,
    data,
    errors,
    totalRows: parseResult.data.length,
  };
}
