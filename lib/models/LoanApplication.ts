import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoanApplication extends Document {
  clerkId: string;
  email: string;
  name: string;
  assessmentId: string;
  trustScore: number;
  riskTier: string;
  grade: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsAmount: number;
  loanAmount: number;
  loanPurpose: string;
  loanTenureMonths: number;
  breakdown: Record<string, unknown>;
  insights: Array<{ type: string; message: string; impact: string }>;
  status: "pending" | "approved" | "rejected";
  lenderNote: string;
  lenderClerkId: string;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LoanApplicationSchema = new Schema<ILoanApplication>(
  {
    clerkId: { type: String, required: true, index: true },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    assessmentId: { type: String, required: true },
    trustScore: { type: Number, required: true },
    riskTier: { type: String, required: true },
    grade: { type: String, required: true },
    monthlyIncome: { type: Number, default: 0 },
    monthlyExpenses: { type: Number, default: 0 },
    savingsAmount: { type: Number, default: 0 },
    loanAmount: { type: Number, required: true },
    loanPurpose: { type: String, required: true },
    loanTenureMonths: { type: Number, required: true },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    insights: [{ type: { type: String }, message: String, impact: String }],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    lenderNote: { type: String, default: "" },
    lenderClerkId: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const LoanApplication: Model<ILoanApplication> =
  mongoose.models.LoanApplication ||
  mongoose.model<ILoanApplication>("LoanApplication", LoanApplicationSchema);

export default LoanApplication;
