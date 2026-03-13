import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import LoanApplication from "@/lib/models/LoanApplication";
import Assessment from "@/lib/models/Assessment";
import { z } from "zod";

const ApplySchema = z.object({
  assessmentId: z.string(),
  loanAmount: z.number().min(1000),
  loanPurpose: z.string().min(3),
  loanTenureMonths: z.number().min(1).max(360),
});

// POST — user submits a loan application
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    // Get the assessment to pull score data
    const assessment = await Assessment.findById(parsed.data.assessmentId).lean();
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    if ((assessment as any).clerkId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already applied with same assessment
    const existing = await LoanApplication.findOne({
      clerkId: userId,
      assessmentId: parsed.data.assessmentId,
      status: "pending",
    });
    if (existing) {
      return NextResponse.json({ error: "You already have a pending application with this assessment." }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || (assessment as any).email || "";
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || (assessment as any).name || "";

    const a = assessment as any;
    const application = await LoanApplication.create({
      clerkId: userId,
      email,
      name,
      assessmentId: parsed.data.assessmentId,
      trustScore: a.trustScore,
      riskTier: a.riskTier,
      grade: a.grade,
      monthlyIncome: a.monthlyIncome,
      monthlyExpenses: a.monthlyExpenses,
      savingsAmount: a.savingsAmount,
      breakdown: a.breakdown,
      insights: a.insights,
      loanAmount: parsed.data.loanAmount,
      loanPurpose: parsed.data.loanPurpose,
      loanTenureMonths: parsed.data.loanTenureMonths,
      status: "pending",
    });

    return NextResponse.json({ success: true, applicationId: application._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// GET — lender fetches all applications, user fetches their own
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (role === "lender") {
      // Return all applications for lender view
      const applications = await LoanApplication.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return NextResponse.json({ applications });
    } else {
      // Return only this user's applications
      const applications = await LoanApplication.find({ clerkId: userId })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ applications });
    }
  } catch (error: any) {
    return NextResponse.json({ applications: [], error: error.message });
  }
}
