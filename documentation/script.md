# FinOps Recon AI - Simple 4-Minute Demo Script

Open the live demo: https://finops-recon-ai.vercel.app/

Keep the default 500-record demo loaded. Speak naturally, move slowly enough for the audience to follow, and let the screen do most of the explaining.

## Script

### 0:00 - 0:20 - Introduction

**Show:** The full overview screen.

**Say:**

> "Hi judges, I’m [your name]. This is FinOps Recon AI, our Track 04 AI Finance Controller submission. It is a financial reconciliation tool for merchants. It compares their own transaction records with Razorpay settlement data and the money that actually reaches the bank. I’ll show how it finds mismatches, explains the financial impact, and helps the finance team investigate them."

### 0:20 - 0:45 - The three-way reconciliation idea

**Show:** The Reconciliation Health section and the Merchant -> Razorpay -> Bank flow.

**Say:**

> "The core idea is simple. Money starts with a merchant transaction, is processed and settled by Razorpay, and is finally credited to the merchant's bank. Small differences can happen in fees, GST, refunds, promotions, or missing payouts. FinOps Recon checks these three sources together instead of making a finance user compare them manually."

### 0:45 - 1:10 - Audit results and financial impact

**Show:** Potential Recovery, Match Rate, Open Exceptions, and Volume Audited.

**Say:**

> "The default demo runs 500 sample transactions with 25 seeded exception cases. The dashboard shows a 95% match rate, 25 open exceptions, and ₹1,06,472.57 in potential recovery. The volume card also shows the total order value, what Razorpay logged, and what the bank credited. These figures come from our synthetic dataset, so they demonstrate the audit rules rather than claim production accuracy on live merchant data."

### 1:10 - 1:30 - Demo controls and re-audit

**Show:** The Demo Dataset controls.

**Say:**

> "The demo controls let me switch between 100, 500, and 1,000 records. I can also turn the seeded exception scenario on or off, re-audit the current batch, and export the exception ledger as a CSV. These are demo controls, but they use the same reconciliation workflow each time."

### 1:30 - 1:55 - Inspect transactions

**Show:** The Transactions tab and one exception row.

**Say:**

> "The Transactions view is the main working area. Each row shows the order and customer, payment method, merchant amount, agreed MDR, Razorpay MDR and GST, net payout, payout batch, and bank verification. I can search by order, customer, or batch, and filter to matched records, all discrepancies, or a specific error type."

### 1:55 - 2:25 - Investigate an exception

**Show:** The Exceptions tab, filter one category, and open an exception such as `ORD_10015`.

**Say:**

> "The Exceptions view turns the findings into an investigation queue. I can filter by MDR overcharge, GST error, ghost payout, double refund, or promo misallocation. Opening an exception shows the affected order, settlement and batch IDs, expected value, actual value, severity, and financial impact. I can copy the generated support-ticket draft or download a printable dispute packet."

### 2:25 - 2:55 - Ask the Recon Assistant

**Show:** Open Recon Assistant and use a suggested question.

**Say:**

> "The Recon Assistant lets a finance user ask questions in plain language. I can ask why a payout was lower, which errors were found, or why a specific order was flagged. When Groq is configured, the app sends the current summary and exception data to the language model. If the key is unavailable, the built-in fallback still answers from the same audit data, so the demo remains usable."

### 2:55 - 3:20 - Import bank data

**Show:** Parse Messy Bank CSV, load the sample, run the parser, and show the extracted rows.

**Say:**

> "Bank statements are often messy and do not look like API responses. I can paste raw narration or CSV data here, extract dates, references, amounts, and remitters, review the confidence of each row, and apply the credits back to the audit. The parser handles credit and debit rows separately, so a debit is not incorrectly treated as a bank payout."

### 3:20 - 3:45 - Financial Insights

**Show:** Click **Financial Insights**.

**Say:**

> "The Financial Insights tab gives a higher-level view. The charts show how much leakage belongs to each error category and how frequently each category appears. The bank payout ledger then compares the expected Razorpay settlement for each batch with the amount actually credited by the bank."

### 3:45 - 4:00 - Close

**Show:** Return to the overview.

**Say:**

> "So the complete workflow is: compare the three sources, identify the exceptions, measure the financial impact, investigate with the Recon Assistant, validate bank data, and export or document the next action. That is FinOps Recon AI: a practical way to make settlement reconciliation easier to understand and act on. Thank you."

## If Asked About Razorpay Disputes

Say:

> "The app does not invent or create disputes. Razorpay disputes come from a customer or bank. When an existing Test Mode dispute is available, our secure server adapter can list it and create a real draft contest request. This account currently has no disputes, so the app shows that clearly instead of faking a successful submission."

## Avoid Saying

- "The app creates a Razorpay dispute."
- "A webhook assigned a support ticket."
- "The app submits evidence for review."
- "These are real merchant transactions."
- "The parser is 98% accurate."
