// Agency and EDI constants for 837i generation.
// Override via environment variables in production.

export const AGENCY = {
  name:        process.env.AGENCY_NAME        ?? "Mobile Medical LA, LLC",
  npi:         process.env.AGENCY_NPI         ?? "1083061626",
  ein:         process.env.AGENCY_EIN         ?? "812392334",
  address:     process.env.AGENCY_ADDRESS     ?? "6818 S. La Cienega Blvd Suite 203",
  city:        process.env.AGENCY_CITY        ?? "Inglewood",
  state:       process.env.AGENCY_STATE       ?? "CA",
  zip:         process.env.AGENCY_ZIP         ?? "903024122",
  phone:       process.env.AGENCY_PHONE       ?? "4243253218",
  contactName: process.env.AGENCY_CONTACT     ?? "Nick Yefimov",
  // Specialty taxonomy: Home Health Agency
  taxonomyCode: "251E00000X",
  // EDI sender ID (assigned by clearing house)
  ediSenderId: process.env.EDI_SENDER_ID      ?? "CAA078493",
};

// Fallback payer definitions when no insurance record EDI fields are set.
// Prefer using the insurance record's ediReceiverId / ediReceiverQualifier / sbrPayorQualifier fields.
export const PAYERS: Record<string, { name: string; id: string; qualifier: string; qualifier2: string }> = {
  medicare: {
    name: "Medicare",
    id: "06014",
    qualifier: "ZZ",
    qualifier2: "MA",
  },
  medicaid: {
    name: "Medicaid",
    id: "MEDICAID",
    qualifier: "ZZ",
    qualifier2: "MC",
  },
};

export function getPayer(category: string | undefined) {
  const key = (category ?? "").toLowerCase();
  if (key.startsWith("medicare")) return PAYERS.medicare;
  if (key.startsWith("medicaid")) return PAYERS.medicaid;
  return PAYERS.medicare;
}

// Build payer info from an insurance DB record (preferred) or fall back to PAYERS map.
export function payerFromInsurance(ins: {
  ediReceiverId?: string | null;
  ediReceiverQualifier?: string | null;
  ediReceiverName?: string | null;
  sbrPayorQualifier?: string | null;
  name: string;
  category: string;
} | null | undefined) {
  if (ins?.ediReceiverId) {
    return {
      name: ins.ediReceiverName ?? ins.name,
      id: ins.ediReceiverId,
      qualifier: ins.ediReceiverQualifier ?? "ZZ",
      qualifier2: ins.sbrPayorQualifier ?? "CI",
    };
  }
  return getPayer(ins?.category);
}

// Revenue code fallback map (billing_codes.rev_code is the DB source of truth)
export const REV_CODE_MAP: Record<string, string> = {
  G0299: "0552",
  G0069: "0552",
  G0089: "0552",
  G0493: "0551",
  G0151: "0551",
  Q5001: "0552",
  "99601": "0550",
  "99602": "0550",
};

// HCPCS codes that require a companion Q5001 biosimilar line
export const IVIG_CODES = new Set(["G0299", "G0069", "G0089"]);
