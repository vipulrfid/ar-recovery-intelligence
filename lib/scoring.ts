import { AgingBucket, RiskTier } from '@prisma/client';

export interface InvoiceForScoring {
  daysOverdue: number;
  openAmount: number;
  customerLateRate?: number;
  customerOpenInvoiceCount?: number;
}

export interface ScoringResult {
  priorityScore: number;
  riskTier: RiskTier;
  agingBucket: AgingBucket;
}

/**
 * Calculate days overdue from due date
 */
export function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Determine aging bucket based on days overdue
 */
export function getAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue >= 90) return 'OVER_90';
  if (daysOverdue >= 61) return 'DAYS_61_90';
  if (daysOverdue >= 31) return 'DAYS_31_60';
  return 'CURRENT';
}

/**
 * Calculate priority score using the ML-lite formula
 * score = (daysOverdue*0.4) + (openAmountWeight*0.3) + (customerLateRate*0.2) + (openInvoiceCountWeight*0.1)
 * Normalized to 0-100
 */
export function calculatePriorityScore(invoice: InvoiceForScoring): number {
  // Normalize days overdue (cap at 120 days for scoring purposes)
  const normalizedDaysOverdue = Math.min(invoice.daysOverdue, 120) / 120;
  
  // Normalize open amount (use log scale, cap at $100k)
  const cappedAmount = Math.min(invoice.openAmount, 100000);
  const normalizedAmount = cappedAmount > 0 ? Math.log10(cappedAmount + 1) / Math.log10(100001) : 0;
  
  // Customer late rate is already 0-1
  const normalizedLateRate = invoice.customerLateRate ?? 0;
  
  // Normalize open invoice count (cap at 10)
  const normalizedInvoiceCount = Math.min(invoice.customerOpenInvoiceCount ?? 1, 10) / 10;
  
  // Apply weights
  const score =
    normalizedDaysOverdue * 0.4 +
    normalizedAmount * 0.3 +
    normalizedLateRate * 0.2 +
    normalizedInvoiceCount * 0.1;
  
  // Convert to 0-100 scale
  return Math.round(score * 100);
}

/**
 * Determine risk tier based on priority score
 */
export function getRiskTier(priorityScore: number): RiskTier {
  if (priorityScore >= 80) return 'URGENT';
  if (priorityScore >= 50) return 'FOLLOW_UP';
  return 'MONITOR';
}

/**
 * Complete scoring calculation
 */
export function scoreInvoice(invoice: InvoiceForScoring): ScoringResult {
  const priorityScore = calculatePriorityScore(invoice);
  const riskTier = getRiskTier(priorityScore);
  const agingBucket = getAgingBucket(invoice.daysOverdue);
  
  return {
    priorityScore,
    riskTier,
    agingBucket,
  };
}
