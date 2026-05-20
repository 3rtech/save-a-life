import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown",
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL ?? "not set",
  };

  try {
    const admin = await db.admin.findUnique({ where: { email: "admin@savealifedonors.org" } });
    results.admin_found = !!admin;
    results.admin_status = admin?.status ?? null;
    results.password_hash_prefix = admin?.passwordHash?.slice(0, 7) ?? null;

    if (admin) {
      const valid = await compare("Admin1234!", admin.passwordHash);
      results.password_valid = valid;
    }
  } catch (err) {
    results.db_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(results);
}
