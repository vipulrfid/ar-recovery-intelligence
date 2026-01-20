-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'PARTIAL', 'DISPUTED');

-- CreateEnum
CREATE TYPE "AgingBucket" AS ENUM ('CURRENT', 'DAYS_31_60', 'DAYS_61_90', 'OVER_90');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('URGENT', 'FOLLOW_UP', 'MONITOR');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EMAIL_SENT', 'EMAIL_RECEIVED', 'NOTE_ADDED', 'STATUS_CHANGED', 'PAYMENT_RECORDED', 'DISPUTE_FLAGGED', 'PROMISE_TO_PAY_RECORDED', 'INVOICE_UPLOADED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'SENT', 'ERROR');

-- CreateEnum
CREATE TYPE "PromiseToPayStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'BROKEN');

-- CreateTable
CREATE TABLE "orgs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "defaultPaymentLinkUrl" TEXT,
    "defaultTone" TEXT NOT NULL DEFAULT 'polite',
    "emailAutoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stopAutomationOnDispute" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "orgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "paymentTerms" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalOpenAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOverdueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openInvoiceCount" INTEGER NOT NULL DEFAULT 0,
    "historicalAvgDaysToPay" DOUBLE PRECISION,
    "historicalLateRate" DOUBLE PRECISION,
    "lastPaymentDate" TIMESTAMP(3),
    "disputeFlagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "invoiceAmount" DOUBLE PRECISION NOT NULL,
    "openAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "agingBucket" "AgingBucket" NOT NULL DEFAULT 'CURRENT',
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskTier" "RiskTier" NOT NULL DEFAULT 'MONITOR',
    "disputeFlagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT,
    "invoiceId" TEXT,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpUser" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL,
    "imapPort" INTEGER NOT NULL,
    "imapUser" TEXT NOT NULL,
    "imapPassword" TEXT NOT NULL,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_threads" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT,
    "subject" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "subject" TEXT NOT NULL,
    "rawBody" TEXT NOT NULL,
    "textBody" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intent" TEXT,
    "intentConfidence" DOUBLE PRECISION,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'polite',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_rules" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "conditionsJson" JSONB NOT NULL,
    "actionsJson" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promise_to_pays" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "promisedDate" TIMESTAMP(3) NOT NULL,
    "promisedAmount" DOUBLE PRECISION,
    "sourceMessageId" TEXT,
    "status" "PromiseToPayStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promise_to_pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_orgId_idx" ON "users"("orgId");

-- CreateIndex
CREATE INDEX "customers_orgId_idx" ON "customers"("orgId");

-- CreateIndex
CREATE INDEX "customers_orgId_primaryEmail_idx" ON "customers"("orgId", "primaryEmail");

-- CreateIndex
CREATE INDEX "invoices_orgId_idx" ON "invoices"("orgId");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_orgId_priorityScore_idx" ON "invoices"("orgId", "priorityScore");

-- CreateIndex
CREATE INDEX "invoices_orgId_riskTier_idx" ON "invoices"("orgId", "riskTier");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orgId_invoiceNumber_key" ON "invoices"("orgId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "uploads_orgId_idx" ON "uploads"("orgId");

-- CreateIndex
CREATE INDEX "activities_orgId_idx" ON "activities"("orgId");

-- CreateIndex
CREATE INDEX "activities_customerId_idx" ON "activities"("customerId");

-- CreateIndex
CREATE INDEX "activities_invoiceId_idx" ON "activities"("invoiceId");

-- CreateIndex
CREATE INDEX "email_accounts_orgId_idx" ON "email_accounts"("orgId");

-- CreateIndex
CREATE INDEX "email_threads_orgId_idx" ON "email_threads"("orgId");

-- CreateIndex
CREATE INDEX "email_threads_customerId_idx" ON "email_threads"("customerId");

-- CreateIndex
CREATE INDEX "email_threads_orgId_threadKey_idx" ON "email_threads"("orgId", "threadKey");

-- CreateIndex
CREATE INDEX "email_messages_orgId_idx" ON "email_messages"("orgId");

-- CreateIndex
CREATE INDEX "email_messages_threadId_idx" ON "email_messages"("threadId");

-- CreateIndex
CREATE INDEX "email_messages_messageId_idx" ON "email_messages"("messageId");

-- CreateIndex
CREATE INDEX "email_templates_orgId_idx" ON "email_templates"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_orgId_key_key" ON "email_templates"("orgId", "key");

-- CreateIndex
CREATE INDEX "strategies_orgId_idx" ON "strategies"("orgId");

-- CreateIndex
CREATE INDEX "strategy_rules_orgId_idx" ON "strategy_rules"("orgId");

-- CreateIndex
CREATE INDEX "strategy_rules_strategyId_idx" ON "strategy_rules"("strategyId");

-- CreateIndex
CREATE INDEX "promise_to_pays_orgId_idx" ON "promise_to_pays"("orgId");

-- CreateIndex
CREATE INDEX "promise_to_pays_customerId_idx" ON "promise_to_pays"("customerId");

-- CreateIndex
CREATE INDEX "promise_to_pays_invoiceId_idx" ON "promise_to_pays"("invoiceId");

-- CreateIndex
CREATE INDEX "promise_to_pays_orgId_status_promisedDate_idx" ON "promise_to_pays"("orgId", "status", "promisedDate");

-- CreateIndex
CREATE INDEX "invoice_documents_orgId_idx" ON "invoice_documents"("orgId");

-- CreateIndex
CREATE INDEX "invoice_documents_invoiceId_idx" ON "invoice_documents"("invoiceId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_rules" ADD CONSTRAINT "strategy_rules_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promise_to_pays" ADD CONSTRAINT "promise_to_pays_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promise_to_pays" ADD CONSTRAINT "promise_to_pays_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promise_to_pays" ADD CONSTRAINT "promise_to_pays_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promise_to_pays" ADD CONSTRAINT "promise_to_pays_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "email_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
