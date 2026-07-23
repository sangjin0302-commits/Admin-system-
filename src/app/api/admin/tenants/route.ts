import { NextResponse } from "next/server";
import { createTenant, listTenants } from "@/lib/services/tenant-service";

export async function GET() {
  try {
    return NextResponse.json({ tenants: await listTenants() });
  } catch (err) {
    console.error("[admin/tenants] GET failed", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, subdomain, ownerEmail, plan } = body ?? {};
    if (!name || !subdomain || !ownerEmail || !plan) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!["free", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const tenant = await createTenant({ name, subdomain, ownerEmail, plan });
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (err) {
    console.error("[admin/tenants] POST failed", err);
    return NextResponse.json(
      { error: "Error" },
      { status: 500 }
    );
  }
}
