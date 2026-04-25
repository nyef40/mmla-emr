export type Action = "read" | "create" | "update" | "delete";

export type ResourcePermissions = Partial<Record<string, readonly Action[]>>;

export const rolePermissions: Record<"admin" | "staff" | "rn" | "pt", ResourcePermissions> = {
  admin: {
    patients: ["read", "create", "update", "delete"],
    appointments: ["read", "create", "update", "delete"],
    medicalRecords: ["read", "create", "update", "delete"],
    prescriptions: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
  },
  staff: {
    patients: ["read", "create", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read"],
    prescriptions: ["read"],
  },
  rn: {
    patients: ["read", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read", "create", "update"],
    prescriptions: ["read"],
  },
  pt: {
    patients: ["read", "update"],
    appointments: ["read", "create", "update"],
    medicalRecords: ["read", "create", "update"],
    prescriptions: ["read"],
  },
};
