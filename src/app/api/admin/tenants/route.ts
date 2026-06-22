import { NextResponse } from "next/server";
import { createTenant, listTenants } from "@/lib/services/tenant-service";

export async function GET() {
  return NextResponse.json({ tenants: await listTenants() });
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
