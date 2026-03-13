export interface ScoringInput {
  onTimePayments: number;
  totalPayments: number;
  loanRepayments: number;
  loanDefaults: number;
  upiTransactionsMonth: number;
  digitalWalletUsage: number;
  monthsOfHistory: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
  monthlyData: MonthlySnapshot[];
}

export interface MonthlySnapshot {
  month: string;
  income: number;
  expenses: number;
  transactions: number;
  savings: number;
}

export interface ScoreResult {
  trustScore: number;
  riskTier: RiskTier;
  grade: string;
  breakdown: ScoreBreakdown;
  insights: Insight[];
  recommendation: string;
  lenderAdvice: string;
}

export interface ScoreBreakdown {
  paymentReliability: FactorScore;
  transactionConsistency: FactorScore;
  incomeStability: FactorScore;
  spendingDiscipline: FactorScore;
  digitalFootprint: FactorScore;
}

export interface FactorScore {
  score: number;
  weight: number;
  label: string;
  detail: string;
}

export interface Insight {
  type: "positive" | "negative" | "neutral";
  message: string;
  impact: "high" | "medium" | "low";
}

export type RiskTier = "EXCELLENT" | "GOOD" | "FAIR" | "BELOW_AVERAGE" | "HIGH_RISK";

const WEIGHTS = {
  paymentReliability: 0.35,
  transactionConsistency: 0.25,
  incomeStability: 0.20,
  spendingDiscipline: 0.15,
  digitalFootprint: 0.05,
};

function scorePaymentReliability(input: ScoringInput): number {
  if (input.totalPayments === 0) return 50;
  const ratio = input.onTimePayments / input.totalPayments;
  const defaultPenalty = input.loanDefaults * 15;
  const repaymentBonus = Math.min(input.loanRepayments * 5, 20);
  return Math.max(0, Math.min(100, ratio * 80 + repaymentBonus - defaultPenalty));
}

function scoreTransactionConsistency(input: ScoringInput): number {
  const { monthlyData } = input;
  if (!monthlyData || monthlyData.length < 2) return 40;
  const txCounts = monthlyData.map((m) => m.transactions);
  const avg = txCounts.reduce((a, b) => a + b, 0) / txCounts.length;
  const variance = txCounts.reduce((s, t) => s + Math.pow(t - avg, 2), 0) / txCounts.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  return Math.min(100, Math.max(10, 100 - cv * 80) + Math.min(avg / 2, 10));
}

function scoreIncomeStability(input: ScoringInput): number {
  const { monthlyData } = input;
  if (!monthlyData || monthlyData.length < 2) return input.monthlyIncome > 0 ? 60 : 30;
  const incomes = monthlyData.map((m) => m.income).filter((i) => i > 0);
  if (incomes.length < 2) return 50;
  const avg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const variance = incomes.reduce((s, i) => s + Math.pow(i - avg, 2), 0) / incomes.length;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
  let score = Math.max(20, 100 - cv * 100);
  if (incomes.length >= 3) {
    const firstHalf = incomes.slice(0, Math.floor(incomes.length / 2));
    const secondHalf = incomes.slice(Math.floor(incomes.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg > firstAvg * 1.05) score = Math.min(100, score + 10);
    if (secondAvg < firstAvg * 0.9) score = Math.max(0, score - 10);
  }
  return score;
}

function scoreSpendingDiscipline(input: ScoringInput): number {
  if (input.monthlyIncome <= 0) return 40;
  const expRatio = input.monthlyExpenses / input.monthlyIncome;
  const savingsRatio = input.savingsAmount / (input.monthlyIncome * Math.max(input.monthsOfHistory, 1));
  let base = expRatio <= 0.5 ? 100 : expRatio <= 0.7 ? 80 : expRatio <= 0.85 ? 60 : expRatio <= 1.0 ? 35 : 10;
  return Math.min(100, base + Math.min(savingsRatio * 50, 15));
}

function scoreDigitalFootprint(input: ScoringInput): number {
  return Math.min(100,
    Math.min(input.upiTransactionsMonth / 30 * 50, 50) +
    Math.min(input.digitalWalletUsage / 20 * 30, 30) +
    Math.min(input.monthsOfHistory / 24 * 20, 20)
  );
}

function generateInsights(input: ScoringInput): Insight[] {
  const insights: Insight[] = [];
  if (input.totalPayments > 0) {
    const ratio = input.onTimePayments / input.totalPayments;
    if (ratio >= 0.95) insights.push({ type: "positive", message: `Excellent payment record — ${Math.round(ratio * 100)}% on-time rate`, impact: "high" });
    else if (ratio < 0.7) insights.push({ type: "negative", message: `Payment history needs improvement — only ${Math.round(ratio * 100)}% on-time`, impact: "high" });
  }
  if (input.loanDefaults > 0) insights.push({ type: "negative", message: `${input.loanDefaults} loan default(s) detected — significantly impacts score`, impact: "high" });
  if (input.monthlyIncome > 0) {
    const ratio = input.monthlyExpenses / input.monthlyIncome;
    if (ratio > 1) insights.push({ type: "negative", message: "Spending exceeds income — immediate financial attention needed", impact: "high" });
    else if (ratio < 0.6) insights.push({ type: "positive", message: "Strong spending discipline — low expense-to-income ratio", impact: "medium" });
  }
  if (input.savingsAmount > input.monthlyIncome * 3) insights.push({ type: "positive", message: "Emergency fund established — 3+ months of income saved", impact: "medium" });
  if (input.upiTransactionsMonth >= 20) insights.push({ type: "positive", message: "High digital transaction activity builds strong trust footprint", impact: "medium" });
  if (input.monthsOfHistory >= 12) insights.push({ type: "positive", message: "12+ months of data provides reliable financial profile", impact: "low" });
  else if (input.monthsOfHistory < 3) insights.push({ type: "neutral", message: "Limited history — more data will improve score accuracy", impact: "low" });
  return insights;
}

function getRiskTier(score: number): RiskTier {
  if (score >= 801) return "EXCELLENT";
  if (score >= 651) return "GOOD";
  if (score >= 501) return "FAIR";
  if (score >= 301) return "BELOW_AVERAGE";
  return "HIGH_RISK";
}

function getGrade(score: number): string {
  if (score >= 801) return "A+";
  if (score >= 701) return "A";
  if (score >= 651) return "B+";
  if (score >= 601) return "B";
  if (score >= 501) return "C";
  if (score >= 401) return "D";
  return "F";
}

const RECOMMENDATIONS: Record<RiskTier, string> = {
  EXCELLENT: "Eligible for premium financial products including unsecured personal loans up to ₹5L, credit cards, and MSME business loans.",
  GOOD: "Eligible for personal loans up to ₹2L, secured credit cards, and microfinance products with competitive rates.",
  FAIR: "Eligible for microloans up to ₹50K and secured credit products. Improving payment consistency will unlock better options.",
  BELOW_AVERAGE: "Eligible for small emergency microloans with higher interest. Focus on building payment history over the next 6 months.",
  HIGH_RISK: "Currently not eligible for most credit products. Enroll in a financial wellness program and rebuild over 3–6 months.",
};

const LENDER_ADVICE: Record<RiskTier, string> = {
  EXCELLENT: "Low risk profile. Recommend standard terms with potential for preferential pricing.",
  GOOD: "Moderate-low risk. Standard loan products appropriate with normal interest rates.",
  FAIR: "Moderate risk. Consider small-ticket loans with monthly check-ins.",
  BELOW_AVERAGE: "Higher risk. Require collateral or guarantor for loans above ₹25K.",
  HIGH_RISK: "High risk — exercise caution. If lending, require collateral and limit exposure.",
};

export function calculateTrustScore(input: ScoringInput): ScoreResult {
  const p = scorePaymentReliability(input);
  const c = scoreTransactionConsistency(input);
  const i = scoreIncomeStability(input);
  const s = scoreSpendingDiscipline(input);
  const d = scoreDigitalFootprint(input);

  const composite = p * WEIGHTS.paymentReliability + c * WEIGHTS.transactionConsistency +
    i * WEIGHTS.incomeStability + s * WEIGHTS.spendingDiscipline + d * WEIGHTS.digitalFootprint;

  const trustScore = Math.round(Math.max(50, composite * 10));
  const riskTier = getRiskTier(trustScore);

  const breakdown: ScoreBreakdown = {
    paymentReliability: { score: Math.round(p), weight: 35, label: "Payment Reliability", detail: `${input.onTimePayments}/${input.totalPayments} on-time payments` },
    transactionConsistency: { score: Math.round(c), weight: 25, label: "Transaction Consistency", detail: `~${input.upiTransactionsMonth} digital tx/month` },
    incomeStability: { score: Math.round(i), weight: 20, label: "Income Stability", detail: `₹${input.monthlyIncome.toLocaleString()}/month avg` },
    spendingDiscipline: { score: Math.round(s), weight: 15, label: "Spending Discipline", detail: `${Math.round((input.monthlyExpenses / Math.max(input.monthlyIncome, 1)) * 100)}% expense ratio` },
    digitalFootprint: { score: Math.round(d), weight: 5, label: "Digital Footprint", detail: `${input.monthsOfHistory} months of history` },
  };

  return {
    trustScore,
    riskTier,
    grade: getGrade(trustScore),
    breakdown,
    insights: generateInsights(input),
    recommendation: RECOMMENDATIONS[riskTier],
    lenderAdvice: LENDER_ADVICE[riskTier],
  };
}
