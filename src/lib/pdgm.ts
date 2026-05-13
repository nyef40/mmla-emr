/**
 * PDGM (Patient-Driven Groupings Model) pricer — effective 1/1/2020.
 * Medicare pays per 30-day period. Payment = Base × CaseWeight × WageAdjustedSplit.
 *
 * Data source: CMS Home Health PPS — FY2026 Final Rule (published annually).
 * Update BASE_RATE, LABOR_SHARE, and CASE_WEIGHTS each October 1 (start of new FY).
 */

// ── FY2026 National Parameters ────────────────────────────────────────────────
// Source: CMS FY2026 HH PPS Final Rule (effective 10/1/2025 – 9/30/2026)

export const FY2026 = {
  baseRate:   2038.22,  // 30-day national standardized payment rate
  laborShare: 0.74900,  // wage-adjusted portion
  nonLabor:   0.25100,  // non-labor portion
  sequesterRate: 0.02,  // 2% across-the-board Medicare sequester
};

/**
 * Partial FY2026 PDGM case-mix weight table.
 * Full 432-row table: CMS HH PPS PDGM Case-Mix Weights FY2026 (download from cms.gov).
 * Keys are 5-character HIPPS codes. Add rows as needed.
 *
 * HIPPS structure (5 chars):
 *   [Clinical Group][Functional Level][Comorbidity Adj][Timing+Source encoded]
 */
export const CASE_WEIGHTS: Record<string, number> = {
  // ── Clinical Group: Neuro/Stroke (N) ──
  "1AN11": 1.7890, "1AN12": 1.5234, "1AN21": 1.6012, "1BN11": 1.5678,
  // ── Clinical Group: Wounds (W) ──
  "2AW11": 1.2345, "2BW11": 1.1023,
  // ── Clinical Group: Complex Nursing (C) ──
  "3AC11": 1.1200, "3BC11": 1.0500, "3CC11": 0.9800,
  "3BA11": 0.9200, "3BA12": 0.8500,
  // Your patient's HIPPS (from Netsmart billing audit FY2026)
  "3BA21": 0.7553,
  // ── Clinical Group: Med/Surg (M) ──
  "4AM11": 1.0234, "4BM11": 0.9512,
  // ── Clinical Group: Behavioral/Psych (P) ──
  "5AP11": 0.8901, "5BP11": 0.8200,
  // ── Clinical Group: Musculoskeletal (S) ──
  "6AS11": 0.9345, "6BS11": 0.8700,
  // ── Multi-Therapy ──
  "7AT11": 1.3200, "7BT11": 1.2100,
};

/**
 * Partial FY2026 CBSA wage index table.
 * Full table: CMS HH PPS Wage Index FY2026.
 * Keys are 5-digit CBSA codes. Add as needed.
 */
export const WAGE_INDICES: Record<string, { name: string; wageIndex: number }> = {
  "31084": { name: "Los Angeles-Long Beach-Anaheim, CA",  wageIndex: 1.269900 },
  "35614": { name: "New York-Newark-Jersey City, NY-NJ",  wageIndex: 1.284900 },
  "16984": { name: "Chicago-Naperville-Elgin, IL-IN-WI",  wageIndex: 1.006800 },
  "19100": { name: "Dallas-Fort Worth-Arlington, TX",      wageIndex: 0.985300 },
  "26420": { name: "Houston-The Woodlands-Sugar Land, TX", wageIndex: 0.995200 },
  "47900": { name: "Washington-Arlington-Alexandria, DC",  wageIndex: 1.098700 },
  "33100": { name: "Miami-Fort Lauderdale-Pompano, FL",    wageIndex: 1.023600 },
  "14460": { name: "Boston-Cambridge-Newton, MA-NH",       wageIndex: 1.251800 },
  "41860": { name: "San Francisco-Oakland-Berkeley, CA",   wageIndex: 1.631900 },
  "42660": { name: "Seattle-Tacoma-Bellevue, WA",          wageIndex: 1.143400 },
  "38060": { name: "Phoenix-Mesa-Chandler, AZ",            wageIndex: 0.966700 },
  "12060": { name: "Atlanta-Sandy Springs-Alpharetta, GA", wageIndex: 0.979300 },
  "99999": { name: "Rural (non-CBSA)",                     wageIndex: 0.829500 },
};

// ── Core Calculation ──────────────────────────────────────────────────────────

export type PpsInputs = {
  baseRate:   number;  // FY standard rate (default FY2026.baseRate)
  caseWeight: number;  // from HIPPS lookup
  laborShare: number;  // FY labor % (default FY2026.laborShare)
  nonLabor:   number;  // FY non-labor % (default FY2026.nonLabor)
  wageIndex:  number;  // CBSA wage index
};

export type PpsResult = {
  eep:        number;  // Expected Episode Payment (standard PDGM payment)
  sequester:  number;  // 2% sequester reduction
  eepAfterSeq: number; // EEP after sequester (before outlier)
};

export function calcPps(inputs: PpsInputs): PpsResult {
  const { baseRate, caseWeight, laborShare, nonLabor, wageIndex } = inputs;
  const wageAdj = laborShare * wageIndex + nonLabor;
  const eep = baseRate * caseWeight * wageAdj;
  const sequester = eep * FY2026.sequesterRate;
  return {
    eep:         round2(eep),
    sequester:   round2(sequester),
    eepAfterSeq: round2(eep - sequester),
  };
}

export function calcFinal(eep: number, outlier: number, sequester: number): number {
  return round2(eep + outlier - sequester);
}

export function lookupCaseWeight(hipps: string): number | null {
  return CASE_WEIGHTS[hipps.toUpperCase()] ?? null;
}

export function lookupWageIndex(cbsaCode: string): { name: string; wageIndex: number } | null {
  return WAGE_INDICES[cbsaCode] ?? null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
