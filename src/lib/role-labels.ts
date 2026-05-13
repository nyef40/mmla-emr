/**
 * Display labels for roles (UI only). Storage and API use lowercase: admin, staff, rn, pt.
 */
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  staff: "Staff",
  rn: "Registered Nurse",
  pt: "Physical Therapist",
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
