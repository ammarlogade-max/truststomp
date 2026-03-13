# TrustStomp — Alternative Credit Scoring

> HackStomp 2026 · FinTech Domain · PS: HS_PS-1

Build a financial identity without a bank account. TrustStomp scores unbanked individuals using digital transaction data, UPI activity, payment reliability, and spending behaviour.

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your keys (see SETUP.md)

# 3. Run
npm run dev
```

Open http://localhost:3000

---

## Features

| Feature | Description |
|---|---|
| **CSV Import** | Upload bank statement CSV → auto-fills all fields instantly |
| **Manual Entry** | 4-step guided form as fallback |
| **Trust Score** | ML-style 5-factor weighted algorithm (0–1000) |
| **Animated Score** | SVG gauge with smooth animation |
| **PDF Export** | Print-formatted report via browser |
| **Dashboard** | Score history, radar chart, factor breakdown |
| **Auth** | Clerk v5 — email, Google, etc. |
| **Persistence** | MongoDB Atlas via Mongoose |
| **Settings** | Profile edit, sign-out, delete all data |

---

## Scoring Algorithm

| Factor | Weight | Signal |
|---|---|---|
| Payment Reliability | 35% | On-time payments, loan defaults |
| Transaction Consistency | 25% | Monthly digital transaction variance |
| Income Stability | 20% | Income coefficient of variation |
| Spending Discipline | 15% | Expense/income ratio + savings |
| Digital Footprint | 5% | UPI usage, wallet activity, history length |

**Score tiers:** Excellent (801+) · Good (651–800) · Fair (501–650) · Below Average (301–500) · High Risk (0–300)

---

## CSV Import

Supported formats (any CSV with standard columns):
- HDFC, SBI, ICICI, Axis bank statement exports
- GPay / PhonePe transaction exports
- Any CSV with Date, Description, Debit/Credit or Amount columns

The parser auto-detects column names, separators (`,` `;` `\t`), date formats (DD-MM-YYYY, YYYY-MM-DD etc.), and UPI/wallet/loan transactions.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Auth:** Clerk v5
- **Database:** MongoDB Atlas + Mongoose
- **Charts:** Recharts
- **Validation:** Zod

---

## Environment Variables

See `.env.example` for all required variables.

## Deployment

Works on Vercel out of the box:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
