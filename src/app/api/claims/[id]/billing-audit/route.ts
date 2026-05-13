import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { claims, charges, patients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { can } from "@/lib/authorize";
import { FY2026, WAGE_INDICES } from "@/lib/pdgm";

type RouteParams = { params: Promise<{ id: string }> };

function fmt$(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "0.00";
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${m}/${day}/${y}`;
}

function fmtTime(t: string | null | undefined): string {
  if (!t) return "0.00";
  return parseFloat(t).toFixed(2);
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(session.user.role, "claims", "read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const claimId = parseInt(id, 10);

  const claim = await db.query.claims.findFirst({
    where: eq(claims.id, claimId),
    with: {
      patient: true,
      insurance: { columns: { id: true, name: true, category: true } },
    },
  });
  if (!claim) return new NextResponse("Not found", { status: 404 });

  // All charges linked to this claim
  const claimCharges = await db.query.charges.findMany({
    where: eq(charges.claimId, claimId),
    with: {
      clinician: { columns: { name: true } },
    },
    orderBy: (c, { asc }) => [asc(c.chargeDate), asc(c.chargeCode)],
  });

  // Patient diagnoses
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, claim.patientId),
    columns: {
      id: true, firstName: true, lastName: true, patientId: true,
      dateOfBirth: true, socDate: true,
      address: true, city: true, state: true, zip: true,
      primaryDiagnosis: true, otherDiagnoses: true,
      insurancePrimary: true,
    },
  });

  // Build diagnosis list
  const dxList: { code: string; description: string }[] = [];
  if (patient?.primaryDiagnosis?.icdCode) {
    dxList.push({ code: patient.primaryDiagnosis.icdCode, description: patient.primaryDiagnosis.description });
  }
  (patient?.otherDiagnoses ?? []).forEach(d => {
    if (d.icdCode) dxList.push({ code: d.icdCode, description: d.description });
  });

  // PDGM values from claim
  const hipps        = claim.hippsCode ?? "—";
  const eep          = parseFloat(claim.eepAmount ?? "0");
  const outlier      = parseFloat(claim.outlierAmount ?? "0");
  const sequester    = parseFloat(claim.sequesterAmount ?? "0");
  const finalPosted  = parseFloat(claim.finalPosted ?? claim.totalAmount ?? "0");
  const caseWeight   = claim.caseWeight ? parseFloat(claim.caseWeight) : null;
  const wageIndex    = claim.wageIndex ? parseFloat(claim.wageIndex) : null;
  const cbsaCode     = claim.cbsaCode ?? "31084";
  const cbsaInfo     = WAGE_INDICES[cbsaCode];
  const wageIndexVal = wageIndex ?? cbsaInfo?.wageIndex ?? FY2026.laborShare;

  // Compute AFP (Adjusted Federal Payment = EEP before outlier / after sequester)
  const afp = eep > 0 ? eep - sequester : 0;

  // Visit totals
  const totalQty  = claimCharges.reduce((s, c) => s + c.quantity, 0);
  const totalTime = claimCharges.reduce((s, c) => s + parseFloat(c.visitTime ?? "0"), 0);
  const totalBilled = claimCharges.reduce((s, c) => s + parseFloat(c.billedAmount ?? "0"), 0);

  // Determine episode timing from HIPPS (position 4: 1=early, 2=late)
  const timingChar = hipps.length >= 4 ? hipps[3] : "";
  const timingLabel = timingChar === "1" ? "Early" : timingChar === "2" ? "Late" : "—";
  const sourceChar  = hipps.length >= 5 ? hipps[4] : "";
  const sourceLabel = sourceChar === "1" ? "Community" : sourceChar === "2" ? "Institutional" : "—";

  // DOB — dateOfBirth is a Date object from Postgres; convert via ISO string
  const dobRaw = patient?.dateOfBirth;
  const dobIso = dobRaw instanceof Date
    ? dobRaw.toISOString().slice(0, 10)
    : dobRaw ? String(dobRaw).slice(0, 10) : null;

  // Patient address
  const patAddr = [patient?.address, patient?.city, patient?.state, patient?.zip]
    .filter(Boolean).join(" ");

  // Insurance label
  const insName     = claim.insurance?.name ?? (patient?.insurancePrimary as { name?: string } | null)?.name ?? "Unknown";
  const insPlanCode = "60021/Master";
  const insCategory = claim.insurance?.category ?? (patient?.insurancePrimary as { category?: string } | null)?.category ?? "";

  // Billing method label — "Normal" for commercial, "MCR-PDGM" for Medicare PPS
  const isMedicarePps = insCategory.toLowerCase().startsWith("medicare") && !!claim.hippsCode;
  const methodLabel   = isMedicarePps ? "MCR-PDGM" : "Normal";
  const periodLabel   = isMedicarePps ? "Medicare Final" : "Normal";

  // Generate contract number from insurance primary
  const contractNum = (patient?.insurancePrimary as { policyNumber?: string } | null)?.policyNumber ?? "7QE6T43VU87";

  const now = new Date();
  const printTs = now.toLocaleDateString("en-US") + " " + now.toLocaleTimeString("en-US");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Billing Audit Report — ${patient?.lastName ?? ""}, ${patient?.firstName ?? ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
    .header-center { text-align: center; flex: 1; }
    .header-center h1 { font-size: 13px; font-weight: bold; }
    .agency { text-align: right; font-size: 10px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 4px; font-size: 9.5px; text-align: left; }
    .section-bar { background: #ddd; font-weight: bold; padding: 2px 4px; font-size: 10px; margin: 6px 0 2px; }
    .payor-row { border: 1px solid #999; padding: 2px 4px; margin: 4px 0; display: flex; gap: 20px; }
    .dx-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin: 4px 0; }
    .dx-item { font-size: 9px; }
    .data-table th { background: #eee; border-bottom: 1px solid #999; font-weight: bold; text-align: right; }
    .data-table td { border-bottom: 1px solid #eee; }
    .data-table td:not(:first-child) { text-align: right; }
    .totals-row td { font-weight: bold; border-top: 1px solid #999; }
    .pps-block { margin: 8px 0 4px; border-top: 1px solid #666; padding-top: 4px; font-size: 9.5px; line-height: 1.7; }
    .pps-block b { font-weight: bold; }
    .grand { border-top: 2px solid #000; margin-top: 10px; padding-top: 4px; }
    .grand table th { background: #ccc; }
    @media print {
      body { padding: 10px; }
      @page { size: letter; margin: 0.5in; }
    }
  </style>
</head>
<body>

<div class="header">
  <div style="font-size:9px; width:200px;">
    ${printTs} Billing Audit Report Page 1
  </div>
  <div class="header-center">
    <h1>Billing Audit Report</h1>
    <div style="font-size:9px;">${periodLabel} &nbsp;&nbsp; Periods From: ${fmtDate(claim.periodStart)} To: ${fmtDate(claim.periodEnd)} &nbsp;&nbsp; Bill Date: ${fmtDate(claim.submittedDate ?? now.toISOString().slice(0, 10))}</div>
  </div>
  <div class="agency" style="width:180px;">Mobile Medical LA, LLC</div>
</div>

<table style="margin-bottom:6px;">
  <tr>
    <td><b>Patient: ${patient?.lastName ?? ""}, ${patient?.firstName ?? ""}</b></td>
    <td>&nbsp;&nbsp; Code: <b>${patient?.patientId ?? ""}</b></td>
    <td>&nbsp;&nbsp; Admit: <b>${fmtDate(patient?.socDate)}</b></td>
    <td>&nbsp;&nbsp; Admit No: <b>${patient?.patientId ?? ""}${claim.claimNumber ? "-" + claim.claimNumber : "-01"}</b></td>
    <td>&nbsp;&nbsp; Birth: <b>${dobIso ? fmtDate(dobIso) : "—"}</b></td>
  </tr>
  <tr>
    <td colspan="5" style="font-size:9px; color:#444;">${patAddr} &nbsp;&nbsp; Unit: Mobile Medical LA, LLC</td>
  </tr>
</table>

<!-- Payor header -->
<table style="border: 1px solid #999; margin-bottom: 4px;">
  <thead>
    <tr style="background:#eee; font-weight:bold; font-size:9px;">
      <td width="140">Payor</td>
      <td width="120">Code/Plan</td>
      <td width="100">Contract</td>
      <td width="80">Start</td>
      <td width="80">Stop</td>
      <td width="100">Class</td>
      <td width="60">CoPay</td>
      <td width="80">Method</td>
    </tr>
  </thead>
  <tbody>
    <tr style="font-size:9px;">
      <td>1 ${insName}</td>
      <td>${insPlanCode}</td>
      <td>${contractNum}</td>
      <td>${fmtDate(patient?.socDate)}</td>
      <td>12/31/2099</td>
      <td>${insCategory} Class</td>
      <td>0.00</td>
      <td>${methodLabel}</td>
    </tr>
  </tbody>
</table>

<!-- Diagnoses -->
${dxList.length > 0 ? `
<div style="margin: 4px 0;">
  <b style="font-size:9px;">Order Diagnosis:</b>
  <div class="dx-grid">
    ${dxList.map((d, i) => `<div class="dx-item">${String(i + 1).padStart(2, "0")} ${d.code}&nbsp; ${d.description}</div>`).join("")}
  </div>
</div>
` : ""}

<!-- Charge table -->
<div class="section-bar">Skilled Nursing</div>
<table class="data-table">
  <thead>
    <tr>
      <th style="text-align:left;">Date</th>
      <th style="text-align:left;">Description</th>
      <th style="text-align:left;">Employee</th>
      <th>Qty</th>
      <th>Time</th>
      <th>Total</th>
      <th>Payor1</th>
      <th>Payor2</th>
      <th>Payor3</th>
      <th>Payor4</th>
      <th>Allow</th>
    </tr>
  </thead>
  <tbody>
    ${claimCharges.map(c => `
    <tr>
      <td>${fmtDate(c.chargeDate)}</td>
      <td>${c.chargeCode}</td>
      <td>${c.clinician?.name ?? "—"}</td>
      <td style="text-align:right;">${c.quantity}</td>
      <td style="text-align:right;">${fmtTime(c.visitTime)}</td>
      <td style="text-align:right;">${fmt$(c.billedAmount)}</td>
      <td style="text-align:right;">${fmt$(c.billedAmount)}</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
    </tr>`).join("")}
    <tr class="totals-row">
      <td colspan="3" style="text-align:right; padding-right:8px;">Totals:</td>
      <td style="text-align:right;">${totalQty}</td>
      <td style="text-align:right;">${totalTime.toFixed(2)}</td>
      <td style="text-align:right;">${fmt$(totalBilled)}</td>
      <td style="text-align:right;">${fmt$(totalBilled)}</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
      <td style="text-align:right;">0.00</td>
    </tr>
    <tr>
      <td colspan="3" style="text-align:right; padding-right:8px; color:#555;">Pat Totals:</td>
      <td style="text-align:right;">${totalQty}</td>
      <td style="text-align:right;">${totalTime.toFixed(2)}</td>
      <td colspan="5"></td>
    </tr>
  </tbody>
</table>

<!-- PPS block -->
<div class="pps-block">
  <div><b>Final Claim for Episode (Period-${timingChar === "1" ? "1" : "2"}) From: ${fmtDate(claim.periodStart)} To: ${fmtDate(claim.periodEnd)}</b></div>
  <br/>
  ${eep > 0 ? `
  <div>Assessment-Date: ${fmtDate(claim.submittedDate)} &nbsp;&nbsp; RFA: 4 (Follow Up) &nbsp;&nbsp; HIPPS-Code: <b>${hipps}</b></div>
  <div>Reason for Final Claim: Completed Period on: ${fmtDate(claim.periodEnd)}</div>
  <div>EEP: <b>${fmt$(eep)}</b> &nbsp;&nbsp; Final Posted: <b>${fmt$(finalPosted)}</b> &nbsp;&nbsp; Net Revenue: <b>${fmt$(finalPosted)}</b> &nbsp;&nbsp; Bill-Date: <b>${fmtDate(claim.submittedDate ?? now.toISOString().slice(0, 10))}</b></div>
  ${outlier > 0 ? "<div>This claim was adjusted because Outlier conditions were found.</div>" : ""}
  ${afp > 0 || outlier > 0 || sequester > 0 ? `<div>AFP: <b>${fmt$(afp)}</b> &nbsp;&nbsp; Outlier: <b>${fmt$(outlier)}</b> &nbsp;&nbsp; Sequester/Other-Adj: <b>-${fmt$(sequester)}</b></div>` : ""}
  <div>Std-Rate: <b>${fmt$(FY2026.baseRate)}</b> &nbsp;&nbsp; Labor-Rate: <b>${FY2026.laborShare.toFixed(5)}</b> &nbsp;&nbsp; Non-Labor-Rate: <b>${FY2026.nonLabor.toFixed(5)}</b> &nbsp;&nbsp; MSA/CBSA-Wage%: <b>${wageIndexVal.toFixed(6)}</b> &nbsp;&nbsp; MSA/CBSA-Code: <b>${cbsaCode}</b></div>
  <div>Episode-Timing: <b>${timingLabel}</b> &nbsp;&nbsp; Period-Referral-Source: <b>${sourceLabel}</b></div>
  ${caseWeight ? `<div>Condition 1: <b>${hipps}</b> &nbsp;&nbsp; Case Weight: <b>${caseWeight.toFixed(7)}</b> &nbsp;&nbsp; Accrual: ${fmtDate(claim.periodStart)} &nbsp;&nbsp; Lupa Threshold &lt; 2</div>` : ""}
  ` : `<div style="color:#888;">PDGM data not yet entered. Use the claim detail page to add EEP, HIPPS, and PPS values.</div>`}

  <div style="margin-top:6px; display:flex; gap:30px; border-top:1px solid #999; padding-top:3px;">
    <span>${fmt$(totalBilled)}</span>
    <span>${fmt$(totalBilled)}</span>
    <span>0.00</span>
    <span>0.00</span>
    <span>0.00</span>
    <span>0.00</span>
  </div>
</div>

<!-- Page 2: Grand Totals -->
<div class="grand" style="margin-top:30px;">
  <div class="header" style="border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:6px;">
    <div style="font-size:9px; width:200px;">${printTs} Billing Audit Report Page 2</div>
    <div class="header-center">
      <h1>Billing Audit Report</h1>
      <div style="font-size:9px;">${periodLabel} &nbsp;&nbsp; Periods From: ${fmtDate(claim.periodStart)} To: ${fmtDate(claim.periodEnd)} &nbsp;&nbsp; Bill Date: ${fmtDate(claim.submittedDate ?? now.toISOString().slice(0, 10))}</div>
    </div>
    <div class="agency" style="width:180px;">Mobile Medical LA, LLC</div>
  </div>

  <h3 style="font-size:11px; margin-bottom:6px;">Grand Totals:</h3>
  <table class="data-table" style="border:1px solid #999;">
    <thead>
      <tr>
        <th style="text-align:left;">Payor</th>
        <th style="text-align:left;">Modality</th>
        <th>Quantity</th>
        <th>Visit-Time</th>
        <th>Billed</th>
        <th>Allowance</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:bold;" colspan="7">${insName}: ${insPlanCode}</td>
      </tr>
      <tr>
        <td></td>
        <td>Skilled Nursing</td>
        <td style="text-align:right;">${totalQty}</td>
        <td style="text-align:right;">${totalTime.toFixed(2)}</td>
        <td style="text-align:right;">0.00</td>
        <td style="text-align:right;">0.00</td>
        <td style="text-align:right;">0.00</td>
      </tr>
      ${eep > 0 ? `
      <tr>
        <td></td>
        <td>PPS Revenue</td>
        <td style="text-align:right;">0</td>
        <td style="text-align:right;">0.00</td>
        <td style="text-align:right;">${fmt$(finalPosted)}</td>
        <td style="text-align:right;">0.00</td>
        <td style="text-align:right;">${fmt$(finalPosted)}</td>
      </tr>` : ""}
      <tr class="totals-row">
        <td style="font-weight:bold;">Claims: 1</td>
        <td style="font-weight:bold;">Payor Totals:</td>
        <td style="text-align:right; font-weight:bold;">${totalQty}</td>
        <td style="text-align:right; font-weight:bold;">${totalTime.toFixed(2)}</td>
        <td style="text-align:right; font-weight:bold;">${fmt$(eep > 0 ? finalPosted : totalBilled)}</td>
        <td style="text-align:right; font-weight:bold;">0.00</td>
        <td style="text-align:right; font-weight:bold;">${fmt$(eep > 0 ? finalPosted : totalBilled)}</td>
      </tr>
      <tr class="totals-row" style="border-top:2px solid #000;">
        <td style="font-weight:bold;">Claims: 1</td>
        <td style="font-weight:bold;">Final Totals:</td>
        <td style="text-align:right; font-weight:bold;">${totalQty}</td>
        <td style="text-align:right; font-weight:bold;">${totalTime.toFixed(2)}</td>
        <td style="text-align:right; font-weight:bold;">${fmt$(eep > 0 ? finalPosted : totalBilled)}</td>
        <td style="text-align:right; font-weight:bold;">0.00</td>
        <td style="text-align:right; font-weight:bold;">${fmt$(eep > 0 ? finalPosted : totalBilled)}</td>
      </tr>
    </tbody>
  </table>
</div>

<div style="margin-top:20px; text-align:center;">
  <button onclick="window.print()" style="padding:6px 20px; font-size:11px; cursor:pointer; border:1px solid #999; background:#f5f5f5; border-radius:3px;">
    🖨️ Print / Save as PDF
  </button>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
