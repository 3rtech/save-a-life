import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const charges = await db.charge.findMany({
    include: {
      donor: { select: { firstName: true, lastName: true, email: true } },
      campaign: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Date", "Donor Name", "Donor Email", "Campaign", "Amount", "Status", "Stripe Intent ID"],
    ...charges.map((c) => [
      c.chargedAt?.toISOString() ?? c.createdAt.toISOString(),
      `${c.donor.firstName} ${c.donor.lastName}`,
      c.donor.email,
      c.campaign.title,
      c.chargedAmountCents != null ? (c.chargedAmountCents / 100).toFixed(2) : "",
      c.status,
      c.stripePaymentIntentId ?? "",
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="charges-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
