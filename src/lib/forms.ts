/**
 * Role-based form names for Menus Overview (OASIS, Clinical, Shared).
 * Used by /admin/forms-overview. No OASIS logic yet — structured display only.
 */

export const formsByRole = {
  pt: {
    oasis: [
      "OASIS PT Other Follow Up",
      "OASIS PT Resumption of Care",
      "OASIS Transfer Non-Visit Physical Therapy",
      "OASIS Transfer Physical Therapy",
      "OASIS Discharge Non-Visit Physical Therapy",
      "OASIS Discharge Physical Therapy",
    ],
    clinical: [
      "Physical Therapy Visit Note",
      "Physical Therapy Adult Assessment - ROC",
      "Physical Therapy Evaluation & Care Plan",
      "Physical Therapy Reassessment",
      "Physical Therapy Patient Transfer/Referral",
      "Physical Therapy Discharge Summary",
      "Physical Therapy Patient Missed Visit",
    ],
    shared: [
      "Care Coordination Note",
      "Inter-Office Communication Note",
      "Medication Profile",
    ],
  },
  rn: {
    oasis: [
      "OASIS RN Resumption of Care",
      "OASIS RN Recertification",
      "OASIS RN Discharge",
      "OASIS RN Transfer",
    ],
    clinical: [
      "Nursing Visit Note",
      "Nursing Assessment",
      "Nursing Care Plan",
      "Skilled Nursing Discharge Summary",
    ],
    shared: [
      "Care Coordination Note",
      "Inter-Office Communication Note",
      "Medication Profile",
    ],
  },
  staff: {
    oasis: ["OASIS Intake", "OASIS Administrative"],
    clinical: ["Staff Visit Note", "Staff Assessment"],
    shared: [
      "Care Coordination Note",
      "Inter-Office Communication Note",
      "Medication Profile",
    ],
  },
  admin: {
    oasis: ["OASIS Admin Overview", "OASIS Compliance"],
    clinical: ["Admin Clinical Review", "Admin Reports"],
    shared: [
      "Care Coordination Note",
      "Inter-Office Communication Note",
      "Medication Profile",
    ],
  },
} as const;

export type RoleKey = keyof typeof formsByRole;
