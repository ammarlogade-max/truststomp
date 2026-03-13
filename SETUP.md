# Setup Guide

## 1. Clerk (Auth)

1. Go to https://clerk.com → Create application
2. Copy keys to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## 2. MongoDB Atlas (Database)

1. Go to https://cloud.mongodb.com → Create free cluster
2. Database Access → Add user with password
3. Network Access → Add IP `0.0.0.0/0` (allows all — fine for dev/hackathon)
4. Connect → Drivers → Copy connection string
5. Replace `<password>` with your DB user password
6. Add to `.env.local`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/truststomp?retryWrites=true&w=majority
   ```

## 3. Run

```bash
npm install
npm run dev
```

## 4. Demo data (scores ~740)

Step 1: Income ₹45,000 · Expenses ₹28,000 · Savings ₹80,000 · 12 months
Step 2: Total payments 36 · On-time 34 · Loan repayments 2 · Defaults 0
Step 3: UPI transactions 35/month · Wallet 8/month
Step 4: Leave blank (uses averages)

## Deploying to Vercel

1. `git init && git add . && git commit -m "init"`
2. Push to GitHub
3. Import at vercel.com
4. Add all env vars from `.env.local`
5. Deploy → done
