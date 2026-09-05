# FinOps Recon AI - 2-Minute Judge Demo Script

This script is aligned with the current live application. It avoids claiming a live dispute ticket, evidence submission, or production-grade accuracy where those are not currently implemented.

## Before Recording

- Open the live app: https://finops-recon-ai.vercel.app/
- Keep the browser at a laptop/desktop viewport.
- Start on the **Transactions** tab with the default 500-record injected-error dataset.
- If Groq is configured in the deployment, the Recon Assistant will use the LLM. If not, its deterministic fallback still demonstrates the workflow.
- Do not promise a Razorpay dispute ID. The current Test Mode account has no disputes, so show the explicit empty state if the dispute modal is opened.

## Timed Script

| Timestamp | Screen action | Speaker script |
| :--- | :--- | :--- |
| **0:00 - 0:20** | Show the first viewport: header, KPI cards, and **Reconciliation Health** flow. | "Hi judges. FinOps Recon AI is a financial operations console for finding leakage between three sources that normally drift apart: merchant records, Razorpay settlements, and actual bank payouts. The first screen makes that relationship explicit: Merchant, Razorpay, Bank, then matched transactions and exceptions." |
| **0:20 - 0:42** | Point to **Potential Recovery**, **Match Rate**, **Open Exceptions**, and **Volume Audited**. | "Our default demo runs 500 synthetic records with 25 seeded exception cases. The engine calculates a 95% match rate, identifies the affected records, and quantifies ₹1,06,472.57 in potential recovery. These benchmark figures are measured on the synthetic dataset, so they demonstrate the rule engine rather than claim production accuracy." |
| **0:42 - 1:00** | Click **Re-Audit Current Batch**, then show the transaction table. | "I can re-run the three-way audit from the demo controls without changing the workflow. The transaction workspace keeps the important evidence together: order ID, customer and payment method, merchant amount, Razorpay MDR and GST, net payout, bank verification, and the action for an exception." |
| **1:00 - 1:20** | Click **Exceptions**, filter an error type, and open an exception such as `ORD_10015`. | "The Exceptions view turns a mismatch into an investigation queue. For each issue we can see the affected order, batch, expected value, actual value, severity, and financial impact. Opening an exception gives us the audit proof, a generated support-ticket draft, and a printable dispute packet." |
| **1:20 - 1:40** | Open **Recon Assistant** and run a suggested prompt such as the Tuesday payout question or `Explain Order ORD_10015 GST calculation error`. | "The Recon Assistant answers questions against the current audit context. With Groq configured, this request is sent to the LLM with the batch summary and exception records; without a key, the deterministic fallback keeps the demo reliable. The response is constrained to the supplied records and can link an order question back to its exception." |
| **1:40 - 1:55** | Click **Parse Messy Bank CSV**, click **Load Sample Bank Statement**, then **Run Fuzzy AI Ingestion Parser**. | "Bank statements are rarely shaped like clean API responses. Here I can paste raw narration or CSV content, extract dates, UTRs, amounts, and remitters, inspect confidence, and apply the resulting credits back into the three-way audit. The parser is also tested against a supplied CSV fixture containing both credit and debit rows." |
| **1:55 - 2:00** | Return to the overview and close on the health flow. | "The result is a focused reconciliation workflow: compare the three sources, isolate the exceptions, quantify potential recovery, and give finance teams an investigation assistant and evidence packet without pretending that synthetic data or an unavailable Razorpay dispute is production evidence. Thank you." |

## Optional Razorpay Explanation

If a judge asks about the dispute action, use this exact explanation:

> "The app does not fabricate or create disputes. Razorpay disputes originate from a customer or issuing bank. Our Vercel serverless adapter lists existing disputes through Razorpay and can send a real `PATCH /v1/disputes/:id/contest` request in documented draft mode using server-side credentials. This Test Mode account currently has no disputes, so the UI reports that state rather than showing a fake success. Evidence upload and `action: submit` are intentionally deferred."

## Optional Analytics Segment

If there is extra time, click **Financial Insights** and say:

> "Financial Insights breaks the detected impact down by error category and compares expected Razorpay settlement batches with actual bank credits. This lets an operator move from the headline recovery number to the category and payout batch that needs investigation."

## Claims to Avoid

- Do not say the app creates a Razorpay dispute.
- Do not say it assigns a support ticket ID or sends a webhook.
- Do not say the current flow submits evidence for review.
- Do not call the dataset real merchant data.
- Do not claim 98% parser accuracy; the parser exposes confidence for each extracted row.
- Do not describe the Q&A as autonomous; call it the **Recon Assistant**.