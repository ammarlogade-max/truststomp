import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssessment extends Document {
  clerkId: string;
  email: string;
  name: string;
  createdAt: Date;
  monthlyIncome: number;
  monthlyExpenses: number;
  upiTransactionsMonth: number;
  onTimePayments: number;
  totalPayments: number;
  savingsAmount: number;
  loanRepayments: number;
  loanDefaults: number;
  digitalWalletUsage: number;
  monthsOfHistory: number;
  monthlyData: Array<{
    month: string; income: number; expenses: number;
    transactions: number; savings: number;
  }>;
  trustScore: number;
  riskTier: string;
  grade: string;
  recommendation: string;
  breakdown: Record<string, unknown>;
  insights: Array<{ type: string; message: string; impact: string }>;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    clerkId: { type: String, required: true, index: true },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    monthlyIncome: { type: Number, default: 0 },
    monthlyExpenses: { type: Number, default: 0 },
    upiTransactionsMonth: { type: Number, default: 0 },
    onTimePayments: { type: Number, default: 0 },
    totalPayments: { type: Number, default: 0 },
    savingsAmount: { type: Number, default: 0 },
    loanRepayments: { type: Number, default: 0 },
    loanDefaults: { type: Number, default: 0 },
    digitalWalletUsage: { type: Number, default: 0 },
    monthsOfHistory: { type: Number, default: 1 },
    monthlyData: [{ month: String, income: Number, expenses: Number, transactions: Number, savings: Number }],
    trustScore: { type: Number, required: true },
    riskTier: { type: String, required: true },
    grade: { type: String, required: true },
    recommendation: { type: String, default: "" },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    insights: [{ type: { type: String }, message: String, impact: String }],
  },
  { timestamps: true }
);

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ||
  mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export default Assessment;
