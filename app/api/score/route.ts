import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";
import { calculateTrustScore, ScoringInput } from "@/lib/scoring-engine";
import { z } from "zod";

const ScoreSchema = z.object({
  monthlyIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  upiTransactionsMonth: z.number().min(0),
  onTimePayments: z.number().min(0),
  totalPayments: z.number().min(0),
  savingsAmount: z.number().min(0),
  loanRepayments: z.number().min(0).default(0),
  loanDefaults: z.number().min(0).default(0),
  digitalWalletUsage: z.number().min(0).default(0),
  monthsOfHistory: z.number().min(1).default(1),
  monthlyData: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expenses: z.number(),
    transactions: z.number(),
    savings: z.number(),
  })).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ScoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    if (data.onTimePayments > data.totalPayments) {
      return NextResponse.json({ error: "On-time payments cannot exceed total payments" }, { status: 400 });
    }

    const result = calculateTrustScore(data as ScoringInput);

    let email = "", name = "";
    try {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress || "";
      name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    } catch {}

    try {
      await connectDB();
      const assessment = await Assessment.create({
        clerkId: userId, email, name, ...data,
        trustScore: result.trustScore,
        riskTier: result.riskTier,
        grade: result.grade,
        recommendation: result.recommendation,
        breakdown: result.breakdown,
        insights: result.insights,
      });
      return NextResponse.json({ success: true, assessmentId: assessment._id.toString(), result });
    } catch (dbError: any) {
      console.error("[DB SAVE FAILED]", dbError.message);
      return NextResponse.json({
        success: true,
        assessmentId: "local-" + Date.now(),
        result,
        dbWarning: "Score calculated but not saved. Fix MONGODB_URI.",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const assessments = await Assessment.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ assessments, count: assessments.length });
  } catch (error: any) {
    return NextResponse.json({ assessments: [], dbError: error.message });
  }
}
