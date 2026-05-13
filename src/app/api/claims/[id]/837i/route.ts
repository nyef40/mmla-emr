import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { claims, charges, billingCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { AGENCY, payerFromInsurance, IVIG_CODES, REV_CODE_MAP } from "@/lib/agency";

type RouteParams = { params: Promise<{ id: string }> };

function pad(s: string, len: number) { return s.padEnd(len, " "); }
function yymmdd(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(2, 10).replace(/-/g, "");
}
function yyyymmdd(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}
function hhmm() {
  const now = new Date();
  return String(now.getUTCHours()).padStart(2, "0") + String(now.getUTCMinutes()).padStart(2, "0");
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(session.user.role, "claims", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const claim = await db.query.claims.findFirst({
    where: eq(claims.id, claimId),
    with: {
      patient: true,
      insurance: true,
    },
  });
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const postedCharges = await db.query.charges.findMany({
    where: eq(charges.claimId, claimId),
    orderBy: (c, { asc }) => [asc(c.chargeDate), asc(c.chargeCode)],
  });

  if (postedCharges.length === 0) {
    return NextResponse.json({ error: "No charges linked to this claim" }, { status: 422 });
  }

  // Pull billing codes for rev code lookup
  const allCodes = await db.query.billingCodes.findMany();
  const codeMap = new Map(allCodes.map(c => [c.code, c]));

  const patient = claim.patient;
  // Use insurance record EDI fields if available; fall back to patient.insurancePrimary category
  const payer = payerFromInsurance(claim.insurance ?? {
    category: (patient.insurancePrimary as { category?: string } | null)?.category ?? "medicare",
    name: (patient.insurancePrimary as { name?: string } | null)?.name ?? "Medicare",
    ediReceiverId: null, ediReceiverQualifier: null, ediReceiverName: null, sbrPayorQualifier: null,
  });
  const mbi = (patient.insurancePrimary as { policyNumber?: string } | null)?.policyNumber ?? "";

  const now = new Date();
  const control = claim.claimNumber ?? String(claim.id).padStart(9, "0");
  const date6 = yymmdd(now);
  const date8 = yyyymmdd(now);
  const time4 = hhmm();

  const periodStart = claim.periodStart ? yyyymmdd(claim.periodStart) : "";
  const periodEnd   = claim.periodEnd   ? yyyymmdd(claim.periodEnd)   : "";
  const admitDate   = patient.socDate ? yyyymmdd(patient.socDate) : "";
  const dob         = yyyymmdd(patient.dateOfBirth);
  const gender      = patient.gender === "female" ? "F" : "M";

  // Build patient address parts
  const patCity  = patient.city  ?? "";
  const patState = patient.state ?? "";
  const patZip   = (patient.zip  ?? "").replace(/\D/g, "");

  // Diagnoses — strip dots for EDI (G61.81 → G6181)
  function stripDx(code: string) { return code.replace(/\./g, ""); }
  const primaryDxRaw = (patient.primaryDiagnosis as { icdCode?: string } | null)?.icdCode ?? "";
  const primaryDx = stripDx(primaryDxRaw);
  const otherDxList = ((patient.otherDiagnoses as { icdCode?: string }[] | null) ?? [])
    .map(d => d.icdCode ? stripDx(d.icdCode) : null)
    .filter(Boolean) as string[];
  const groupNumber = (patient.insurancePrimary as { groupNumber?: string } | null)?.groupNumber ?? "";

  // Physician — handle both "First Last" and "Last, First" storage formats
  // Strip credential suffixes like "(DO)", "(MD)", "(NP)" from EDI name fields
  function stripCred(s: string) { return s.replace(/\s*\([^)]+\)\s*$/, "").trim(); }
  let phyLast = "Unknown";
  let phyFirst = "";
  const phyRaw = (patient.physicianName ?? "").trim();
  if (phyRaw.includes(",")) {
    const commaIdx = phyRaw.indexOf(",");
    phyLast  = stripCred(phyRaw.slice(0, commaIdx).trim());
    phyFirst = stripCred(phyRaw.slice(commaIdx + 1).trim());
  } else if (phyRaw) {
    const parts = stripCred(phyRaw).split(/\s+/);
    phyLast  = parts.pop() ?? "Unknown";
    phyFirst = parts.join(" ");
  }

  const total = parseFloat(claim.totalAmount ?? "0").toFixed(2);
  const tob   = claim.tobCode ?? "329";
  const hipps = claim.hippsCode ?? "";

  const segments: string[] = [];

  // ISA – interchange header
  segments.push(
    `ISA*00*${pad("", 10)}*00*${pad("", 10)}*ZZ*${pad(AGENCY.ediSenderId, 15)}*${payer.qualifier}*${pad(payer.id, 15)}*${date6}*${time4}*^*00501*${control}*1*P*:`
  );
  segments.push(`GS*HC*${AGENCY.ediSenderId}*${payer.id}*${date8}*${time4}*${control}*X*005010X223A2`);
  segments.push(`ST*837*0001*005010X223A2`);
  segments.push(`BHT*0019*00*${control}*${date8}*${time4}*CH`);

  // Billing provider (submitter)
  segments.push(`NM1*41*2*${AGENCY.name}*****46*${AGENCY.ediSenderId}`);
  segments.push(`PER*IC*${AGENCY.contactName}*TE*${AGENCY.phone}`);
  // Receiver (payer)
  segments.push(`NM1*40*2*${payer.name}*****46*${payer.id}`);

  // HL1 – Billing provider
  segments.push(`HL*1**20*1`);
  segments.push(`PRV*BI*PXC*${AGENCY.taxonomyCode}`);
  segments.push(`NM1*85*2*${AGENCY.name}*****XX*${AGENCY.npi}`);
  segments.push(`N3*${AGENCY.address}`);
  segments.push(`N4*${AGENCY.city}*${AGENCY.state}*${AGENCY.zip}`);
  segments.push(`REF*EI*${AGENCY.ein}`);

  // HL2 – Subscriber/patient
  segments.push(`HL*2*1*22*0`);
  segments.push(`SBR*P*18*${groupNumber}******${(payer as { qualifier2?: string }).qualifier2 ?? "MA"}`);
  segments.push(`NM1*IL*1*${patient.lastName}*${patient.firstName}****MI*${mbi}`);
  if (patient.address) segments.push(`N3*${patient.address}`);
  if (patCity || patState || patZip) segments.push(`N4*${patCity}*${patState}*${patZip}`);
  segments.push(`DMG*D8*${dob}*${gender}`);
  segments.push(`NM1*PR*2*${payer.name}*****PI*${payer.id}`);

  // CLM – claim information
  // CLM05-1 = 2-digit facility type (first 2 chars of TOB), CLM05-3 = frequency (3rd digit of TOB)
  const claimRef  = `${patient.patientId}-${control}`;
  const facType   = tob.slice(0, 2);
  const freqCode  = tob.length >= 3 ? tob.slice(2) : "3";
  segments.push(`CLM*${claimRef}*${total}***${facType}:A:${freqCode}**A*Y*Y`);
  if (periodStart && periodEnd) segments.push(`DTP*434*RD8*${periodStart}-${periodEnd}`);
  if (admitDate) segments.push(`DTP*435*D8*${admitDate}`);
  segments.push(`CL1*9*2*30`);
  segments.push(`REF*EA*${patient.patientId}`);
  if (primaryDx) {
    segments.push(`HI*ABK:${primaryDx}`);
    segments.push(`HI*APR:${primaryDx}`);
  }
  if (otherDxList.length > 0) {
    const dxPairs = otherDxList.map(dx => `ABF:${dx}`).join("*");
    segments.push(`HI*${dxPairs}`);
  }
  if (hipps) segments.push(`BH:50:D8:${admitDate || date8}`);

  // Attending physician
  if (patient.physicianNpi) {
    segments.push(`NM1*71*1*${phyLast}*${phyFirst}****XX*${patient.physicianNpi}`);
  }

  // Service lines
  let lx = 0;

  // Line 1: HIPPS/Home Health Services header
  if (hipps) {
    lx++;
    segments.push(`LX*${lx}`);
    segments.push(`SV2*0023*HP:${hipps}*0*UN*1`);
    const firstDate = yyyymmdd(postedCharges[0].chargeDate);
    segments.push(`DTP*472*D8*${firstDate}`);
  }

  const ivigDatesAdded = new Set<string>();
  // Infusion CPT codes bill in 15-minute units (1 hr = 4 units)
  const INFUSION_CODES = new Set(["99601", "99602"]);

  for (const charge of postedCharges) {
    const bc = codeMap.get(charge.chargeCode);
    const revCode    = bc?.revCode ?? REV_CODE_MAP[charge.chargeCode] ?? "0550";
    const hcpcs      = charge.chargeCode;
    const chargeDate = yyyymmdd(charge.chargeDate);
    const amt        = charge.billedAmount ?? "0.00";

    // 15-min units for infusion codes; otherwise use charge quantity
    let units = charge.quantity;
    if (INFUSION_CODES.has(charge.chargeCode) && charge.visitTime) {
      units = Math.max(1, Math.round(parseFloat(charge.visitTime) * 4));
    }

    lx++;
    segments.push(`LX*${lx}`);
    segments.push(`SV2*${revCode}*HC:${hcpcs}*${amt}*UN*${units}`);
    segments.push(`DTP*472*D8*${chargeDate}`);

    // Add Q5001 companion line for IVIG codes (once per date)
    if (IVIG_CODES.has(charge.chargeCode) && !ivigDatesAdded.has(chargeDate)) {
      ivigDatesAdded.add(chargeDate);
      lx++;
      segments.push(`LX*${lx}`);
      segments.push(`SV2*0552*HC:Q5001*.01*UN*1`);
      segments.push(`DTP*472*D8*${chargeDate}`);
    }
  }

  // SE – transaction trailer
  const segCount = segments.length + 1; // +1 for SE itself
  segments.push(`SE*${segCount}*0001`);
  segments.push(`GE*1*${control}`);
  segments.push(`IEA*1*${control}`);

  const ediText = segments.join("~\n") + "~\n";

  const filename = `${yyyymmdd(now)}_${patient.lastName.toLowerCase()}_${patient.firstName.toLowerCase()}.txt`;
  return new NextResponse(ediText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
