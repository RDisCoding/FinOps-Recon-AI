# FinOps Recon AI — Multi-Source Settlement & Fee Reconciliation Auditor

### **Razorpay Buildathon — Track 04: AI Finance Controller**

[![Track](https://img.shields.io/badge/Track-04:_AI_Finance_Controller-6366f1?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Status](https://img.shields.io/badge/Status-Live_Demo-f59e0b?style=for-the-badge)](https://finops-recon-ai.vercel.app/)
[![Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Vite_|_Tailwind_CSS-06b6d4?style=for-the-badge)](https://vitejs.dev)
[![CI](https://github.com/RDisCoding/FinOps-Recon-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/RDisCoding/FinOps-Recon-AI/actions/workflows/ci.yml)

**[Open the live demo](https://finops-recon-ai.vercel.app/)** · **[View the source code](https://github.com/RDisCoding/FinOps-Recon-AI)**

---

> ### **🏆 Key Submission Benchmark Metric**
>
> **Audited 500 chaotic transaction records totaling ₹40,24,178. Achieved a 95.0% match rate, isolated 100% of the 25 injected fee/GST discrepancies without a single false positive (100% Precision & 100% Recall) in 1.1 ms, and recovered ₹1,06,472 in leaked merchant margin.**

---

## Product Walkthrough

### 1. Reconciliation Overview

The first viewport establishes the operational story immediately: potential recovery, match rate, open exceptions, the Merchant -> Razorpay -> Bank flow, and the transaction workspace.

![FinOps Recon reconciliation overview](docs/images/executive_overview.png)

---

### 2. Transactions and Recon Assistant

The transactions view keeps search, filters, reconciliation status, aligned financial values, and exception actions visible. The Recon Assistant opens as a focused investigation drawer when needed.

![FinOps Recon transactions and assistant](docs/images/qa_agent.png)

---

### 3. Bank Statement Ingestion

Import messy bank narration or CSV content, normalize settlement records, and re-run the reconciliation against the updated bank ledger.

![Unstructured Bank Ingestion](docs/images/bank_ingestion.png)

---

### 4. Dispute Evidence and Razorpay Contest Adapter

Generate a printable dispute packet, then optionally contest an existing Razorpay dispute through the official server-side API adapter. Razorpay disputes originate from a customer or issuing bank; this application does not create new disputes. The public demo account currently has no Test Mode disputes, so this flow is documented rather than represented with a fabricated success screenshot.

---

## 1. The Main Idea

High-volume e-commerce merchants suffer from **3-way financial leakage** across three distinct operational data sources:

1. **Merchant Storefront Order Database**: Internal order logs (Shopify, WooCommerce, Custom DB) tracking gross product prices, payment methods, and discount promo codes.
2. **Razorpay API Settlement Logs**: Payment gateway logs tracking Merchant Discount Rates (MDR), 18% GST tax deductions, refund withholdings, and payout batch IDs.
3. **Company Bank Account Statements**: Actual lump-sum NEFT/RTGS credit deposits hitting the merchant's ICICI/HDFC/SBI bank accounts.

### The FinOps Reality

Payment gateways generate raw settlement reports reflecting their internal computations. Silent operational discrepancies occur due to:

- **Fee Tier Overcharges**: Gateway charging 2.5% MDR instead of contracted 1.5% rate.
- **GST Basis Miscalculations**: 18% GST mistakenly levied on the _gross product order price_ instead of the _MDR processing fee_.
- **Co-Funded Promo Discrepancies**: 100% gateway-funded promotional coupons improperly deducted from merchant payouts.
- **Double Refund Deductions**: Duplicate refund deductions processed across multiple payout batches.
- **Ghost Payouts**: Orders marked as `"SETTLED"` in gateway logs but dropped prior to NEFT deposit due to settlement timing lags (T+1 vs T+3).

**FinOps Recon AI** closes this loop with deterministic mathematical audit rules, an optional Groq-powered natural language Settlement Q&A assistant, and a secure server-side adapter for contesting existing Razorpay disputes.

---

## 2. 3-Way Triangulation Architecture

```mermaid
flowchart TD
    %% Data Sources
    DB["MERCHANT STOREFRONT ORDER DATABASE<br/>[Order ID, Gross Amt, Promo Code]"]
    LOGS["RAZORPAY API SETTLEMENT LOGS<br/>[MDR Rate, GST, Payout Batch]"]
    BANK["BANK PAYOUT STATEMENTS<br/>[Messy Narration CSV, UTR]"]

    %% Processing Engine
    ENGINE["3-WAY DETERMINISTIC RECON ENGINE<br/>- Contractual MDR Rule Enforcer<br/>- 18% GST Basis Tax Audit Rule<br/>- Co-Fund Promo Attribution Rule<br/>- Double Refund Interception Rule<br/>- Bank NEFT Batch Integrity Rule"]

    %% Dashboard & Metrics
    DASHBOARD["EXECUTIVE DASHBOARD & METRICS<br/>- Rs 1,06,472 Leakage Recovered Card<br/>- 95.0% Match Rate (475 / 500 Clean)<br/>- 100% Precision Exception Ledger"]

    %% AI & Action Layer
    QA["Natural Language Q&A Agent<br/>Track 04 LLM Reasoner<br/>Why was Tuesday payout lower?"]
    DISPUTE["Dispute Action Agent<br/>- PDF Audit Packet<br/>- Razorpay Contest Adapter<br/>(Draft Mode)"]

    %% Flow Connections
    DB --> ENGINE
    LOGS --> ENGINE
    BANK --> ENGINE
    ENGINE --> DASHBOARD
    DASHBOARD --> QA
    DASHBOARD --> DISPUTE
```

---

## 3. Deep-Dive: 5 Injected Financial Discrepancies & Math Proofs

Our engine deterministically isolates 5 critical operational error categories across 500 transaction records:

### Rule 1: Contractual MDR Rate Enforcement (`MDR_OVERCHARGE`)

- **Issue**: Gateway charges a higher MDR fee rate than the merchant's contracted tier rate for a payment method.
- **Math Formula**: $\text{Leakage} = \text{Charged MDR Amount} - (\text{Net Order Amount} \times \text{Agreed MDR Rate})$
- **Example**: Order `ORD_10015` (Gross ₹5,000, UPI). Contracted MDR: 1.5% (₹74.99). Gateway Charged: 2.5% (₹124.98). **Leaked Loss: ₹49.99**.

### Rule 2: 18% GST Calculation Basis Audit (`GST_MISCALCULATION`)

- **Issue**: Indian tax law dictates 18% GST applies _only_ to the gateway's MDR service fee. Misconfigured pipelines levy 18% GST on the entire product price.
- **Math Formula**: $\text{Correct GST} = \text{MDR Fee} \times 0.18$
- **Example**: Order `ORD_10015` (Gross ₹5,000, MDR ₹125). Correct 18% GST on MDR = ₹22.50. Miscalculated 18% GST on product = ₹900.00. **Leaked Loss: ₹877.50**.

### Rule 3: Ghost Payouts / Missing Bank Credits (`GHOST_PAYOUT`)

- **Issue**: Transactions logged as `"SETTLED"` under payout batch `BATCH_20260901_AX`, but funds dropped during bank NEFT clearing.
- **Math Formula**: $\text{Batch Discrepancy} = \sum \text{Net Logged Settlements} - \text{Bank Credit Deposit}$
- **Example**: Batch `BATCH_20260901_AX` expected ₹37,54,811.70, but bank statement credited ₹36,91,198.12. **Leaked Loss: ₹63,613.58**.

### Rule 4: Duplicate Refund Deduction Interception (`DOUBLE_REFUND`)

- **Issue**: System retry glitches cause a single customer refund to be deducted twice across settlement batches.
- **Math Formula**: $\text{Leakage} = \text{Logged Refund Deduction} - \text{Gross Order Amount}$
- **Example**: Order `ORD_10042` (Gross ₹1,200). Gateway deducted ₹2,400 in refunds across 2 batches. **Leaked Loss: ₹1,200.00**.

### Rule 5: Co-Funded Promo Attribution (`PROMO_MISALLOCATION`)

- **Issue**: Promotional coupon (e.g. `RAZORPAY50_COFUND`) is 100% co-funded by Razorpay, but deducted from merchant payout.
- **Math Formula**: $\text{Leakage} = \text{Deducted Promo Amount}$ (where Co-Fund Ratio > 50%)
- **Example**: Order `ORD_10088`. Coupon discount ₹250. 100% Razorpay funded, but ₹250 deducted from merchant. **Leaked Loss: ₹250.00**.

---

## 4. Track 04 Feature Breakdown

### 1. Recon Assistant

The **Recon Assistant** is a focused investigation drawer for the current reconciliation batch. With `VITE_GROQ_API_KEY` configured, each question is sent to Groq with the current audit context. Without a key, deterministic local responses keep the demo usable.

- **Preset Prompt Pills**: Judges can test questions with 1 click:
  - _"Why was my payout on Tuesday lower than expected?"_
  - _"Which payment method had the highest rate of tax miscalculations?"_
  - _"Explain Order ORD_10015 GST calculation error."_
- **Line-Item Math & UTR Citations**: Responds in natural English explaining exact order IDs, UTR reference numbers, and mathematical variances.
- **Model behavior**: With `VITE_GROQ_API_KEY` configured, questions are sent to Groq with the current audit context. Without a key, the app uses a deterministic local fallback so the demo remains usable.

### 2. Fuzzy Unstructured Bank Statement Parser

Real bank statements are messy CSVs or raw text lines. Our fuzzy parser modal:

- Accepts raw strings like: `02-09-2026 | RTGS-UTR_ICICI_202609002-RAZORPAY PAYMENTS | CR | ₹39,45,120.00`
- Extracts UTR, remitter name, credit amount, and date with a confidence score.
- Instantly maps extracted lines to `BankStatementCredit[]` and re-runs 3-way reconciliation.

The parser is also tested against the supplied CSV fixture at [`src/services/fixtures/public-bank-statement.csv`](src/services/fixtures/public-bank-statement.csv). Its two rows cover a credit and a debit transaction with separate UTR/reference values, amount, date, and running balance columns. The sample was extracted/provided using [pdf2text.ai](https://pdf2text.ai); this is evidence of handling a real-world-shaped CSV export, not an official endorsement or universal bank-format specification. Scanned PDFs, multi-line narrations, and bank-specific column variations still require additional fixtures or OCR.

### 3. End-to-End Dispute Action Agent (PDF & Contest Adapter)

- **PDF Dispute Packet Generator**: Generates print-ready formal audit packets with letterhead, 3-way line-item tables, and digital signature blocks.
- **Razorpay contest adapter**: The Vercel serverless function calls `PATCH /v1/disputes/:id/contest` in draft mode using server-only Razorpay credentials. A real `disp_...` ID is required; Test Mode accounts may have no disputes available.
- **Dispute discovery**: The app calls `GET /api/razorpay/disputes` through a server-side adapter and displays available dispute IDs in the modal. When the account has none, the UI says so explicitly instead of inventing a test dispute.

---

## 5. Project Architecture & File Directory

```
d:\razorpay-hackathon\
├── docs/
│   └── images/                     # Product walkthrough screenshots
├── src/
│   ├── components/                 # UI React Components
│   │   ├── AnalyticsView.tsx        # Recharts leakage distribution & bank UTR ledger
│   │   ├── AuditRunnerControls.tsx  # Batch size config (100/500/1000) & CSV exporter
│   │   ├── BankUploadModal.tsx      # Unstructured bank statement fuzzy ingestion modal
│   │   ├── DisputeModal.tsx         # Dispute claim ticket, PDF export & contest action
│   │   ├── ExceptionLedger.tsx      # Filterable discrepancy audit trail
│   │   ├── ExecutiveMetrics.tsx     # KPI summary cards (Recovered ₹, Match Rate %)
│   │   ├── Header.tsx               # Branding header & quick actions
│   │   ├── ReconciliationDataGrid.tsx # 3-Way side-by-side triangulation data grid
│   │   └── SettlementQAAgent.tsx    # Slide-out natural language LLM chat sidebar
│   ├── services/                   # Core Business & Audit Logic
│   │   ├── aiAgentService.ts        # Natural language Q&A reasoning & math explanation engine
│   │   ├── auditEngine.ts           # 5-rule deterministic reconciliation audit engine
│   │   ├── bankStatementParser.ts   # Regex & fuzzy text parser for unstructured bank CSVs
│   │   ├── disputeActionService.ts  # PDF packet generator & Razorpay contest client
│   │   └── syntheticDataGenerator.ts# Synthetic dataset generator (500 records, 25 error seeds)
│   ├── types/
│   │   └── reconciliation.ts        # TypeScript interfaces for 3-way data schemas
│   ├── App.tsx                      # Main application container
│   ├── main.tsx                     # Vite entry point
│   └── index.css                    # Enterprise dark-theme design tokens and Tailwind styles
├── api/
│   └── razorpay/
│       ├── disputes.ts              # Server-side dispute listing adapter
│       └── dispute-contest.ts       # Server-side contest adapter
├── .github/workflows/ci.yml         # Automated test, lint, and build checks
├── .env.example                     # Environment variable template
├── README.md                        # Master documentation & judge pitch guide
├── package.json                     # Dependencies & npm scripts
└── vite.config.ts                   # Vite build configuration with Tailwind CSS plugin
```

---

## 6. Local Installation & Development Setup

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/RDisCoding/FinOps-Recon-AI.git
cd FinOps-Recon-AI

# 2. Install dependencies
npm install

# Optional: enable the Groq Q&A integration locally
Copy-Item .env.example .env.local
# Edit .env.local and set VITE_GROQ_API_KEY.
# Do not commit .env.local or use a sensitive production key in a public frontend.

# 3. Launch the local development server
npm run dev

# 4. Build production bundle (Verification)
npm run build

# 5. Run unit tests
npm test

# 6. Run lint checks
npm run lint
```

The local Vite server does not run the `api/` serverless function. Test the Razorpay adapter after deploying to Vercel, or with a local serverless emulator.

### Live Razorpay test-mode contest flow

The live demo is deployed at [finops-recon-ai.vercel.app](https://finops-recon-ai.vercel.app/). To deploy your own instance, import this repository into Vercel so the `api/` serverless function is deployed with it. Add these environment variables in the Vercel project settings:

```env
VITE_GROQ_API_KEY=your_groq_key
VITE_GROQ_MODEL=qwen/qwen3.8-27b
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are server-only variables and must not use the `VITE_` prefix. The Dispute modal requires an existing Razorpay `disp_...` ID and sends a draft contest request to Razorpay. Razorpay disputes originate from a customer or issuing bank; the merchant contests them with evidence. Submitting for review requires at least one Razorpay document ID, so this app intentionally uses the documented `action: draft` flow until evidence upload is implemented.

### Test the live demo

1. Open the [live demo](https://finops-recon-ai.vercel.app/).
2. Review the executive metrics and switch between the data grid, exception ledger, and analytics tabs.
3. Open the Recon Assistant and try a suggested prompt. A deployed build without `VITE_GROQ_API_KEY` uses the deterministic fallback.
4. Open an exception and download its dispute packet.
5. Test the Razorpay contest action only when you have a real Test Mode `disp_...` ID belonging to the configured Razorpay account. The current Test Mode account has no disputes, so this path is not demonstrated in the public deployment.

---

## 7. Verification & Performance Summary

| Benchmark Metric     | Target Standard    | Achieved Score                 | Status      |
| :------------------- | :----------------- | :----------------------------- | :---------- |
| **Audit Speed**      | < 100 ms           | **1.1 ms** (500 records)       | ⚡ EXCEEDS  |
| **Match Rate**       | > 90%              | **95.0%** (475 / 500 Clean)    | 🎯 EXCEEDS  |
| **Precision**        | > 98%              | **100.0%** (0 False Positives) | 🛡️ PERFECT  |
| **Recall**           | > 98%              | **100.0%** (25 / 25 Isolated)  | 🛡️ PERFECT  |
| **Recoverable Loss** | Full Detection     | **₹1,06,472.57**               | 💰 ACCURATE |
| **Build Integrity**  | Zero Errors        | Clean Vite/TypeScript build    | ✅ PASS     |
| **Automated Tests**  | Core logic covered | **7 tests passing**            | ✅ PASS     |
| **CI**               | Every push checked | GitHub Actions workflow        | ✅ PASS     |

These benchmark figures are measured against the deterministic synthetic dataset generated by the application. They demonstrate rule-engine behavior and are not a claim about performance or detection accuracy on production merchant data.

---

_FinOps Recon AI • Built for Razorpay Buildathon 2026_
