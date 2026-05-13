export type Action = "read" | "create" | "update" | "delete";

export type ResourcePermissions = Partial<Record<string, readonly Action[]>>;

export const rolePermissions: Record<"admin" | "staff" | "rn" | "pt", ResourcePermissions> = {
  admin: {
    patients: ["read", "create", "update", "delete"],
    appointments: ["read", "create", "update", "delete"],
    medicalRecords: ["read", "create", "update", "delete"],
    prescriptions: ["read", "create", "update", "delete"],
    visits: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    claims: ["read", "create", "update", "delete"],
    payments: ["read", "create", "delete"],
    charges: ["read", "create", "update", "delete"],
    payroll: ["read", "create", "update", "delete"],
    patient_logs: ["read", "create", "delete"],
  },
  staff: {
    patients: ["read", "create", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read"],
    prescriptions: ["read"],
    visits: ["read", "create", "update"],
    claims: ["read", "create", "update"],
    payments: ["read", "create"],
    charges: ["read", "create", "update", "delete"],
    payroll: ["read", "create"],
    patient_logs: ["read", "create"],
  },
  rn: {
    patients: ["read", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read", "create", "update"],
    prescriptions: ["read"],
    visits: ["read", "create", "update"],
  },
  pt: {
    patients: ["read", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read"],
    prescriptions: ["read"],
    visits: ["read"],
  },
};
