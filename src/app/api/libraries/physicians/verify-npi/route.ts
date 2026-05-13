import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const npi = request.nextUrl.searchParams.get("npi")?.trim();
  if (!npi || !/^\d{10}$/.test(npi)) {
    return NextResponse.json({ error: "NPI must be exactly 10 digits" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error("Registry unreachable");

    const data = await res.json();
    if (!data.result_count || data.result_count === 0) {
      return NextResponse.json({ found: false, message: "NPI not found in registry" });
    }

    const provider = data.results[0];
    const basic = provider.basic ?? {};
    const taxonomy = (provider.taxonomies ?? []).find((t: { primary: boolean }) => t.primary) ?? provider.taxonomies?.[0];

    return NextResponse.json({
      found: true,
      status: basic.status === "A" ? "Active" : "Inactive",
      firstName: basic.first_name ?? basic.authorized_official_first_name ?? null,
      lastName: basic.last_name ?? basic.authorized_official_last_name ?? null,
      credential: basic.credential ?? null,
      specialty: taxonomy?.desc ?? null,
      checkedAt: new Date().toISOString().slice(0, 10),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach NPI Registry" }, { status: 502 });
  }
}
