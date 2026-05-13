// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean, integer, json, jsonb, date, unique, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password"),
  role: text("role").$type<"admin" | "staff" | "rn" | "pt">().default("staff"),
  isActive: boolean("is_active").default(true),
  phone: text("phone"),
  jobTitle: text("job_title"),
  onCall: boolean("on_call").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for NextAuth
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Accounts table for NextAuth (OAuth providers)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Verification tokens for NextAuth
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Update src/db/schema.ts with medical schemas
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").unique().notNull(), // Custom patient ID like "PAT-001"
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").$type<"male" | "female" | "other">().notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: json("emergency_contact").$type<{
    name: string;
    relationship: string;
    phone: string;
  }>(),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medicalConditions: text("medical_conditions"),
  medications: text("medications"),
  notes: text("notes"),
  // Intake fields
  socDate: date("soc_date"),
  admissionStatus: text("admission_status").$type<"admitted" | "discharged" | "pending">().default("admitted"),
  codeStatus: text("code_status").$type<"full_code" | "dnr">().default("full_code"),
  primaryDiagnosis: jsonb("primary_diagnosis").$type<{ description: string; icdCode: string; date: string }>(),
  otherDiagnoses: jsonb("other_diagnoses").$type<{ description: string; icdCode: string; date: string }[]>(),
  insurancePrimary: jsonb("insurance_primary").$type<{ name: string; policyNumber: string; groupNumber: string; category: string; authRequired: boolean }>(),
  insuranceSecondary: jsonb("insurance_secondary").$type<{ name: string; policyNumber: string; groupNumber: string; category: string; authRequired: boolean }>(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  physicianName: text("physician_name"),
  physicianPhone: text("physician_phone"),
  physicianNpi: text("physician_npi"),
  intakeData: jsonb("intake_data").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").default(true),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  appointmentId: text("appointment_id").unique().notNull(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"),
  appointmentType: text("appointment_type").notNull(),
  status: text("status").$type<"scheduled" | "confirmed" | "completed" | "cancelled" | "no_show">().default("scheduled"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  duration: integer("duration").default(30), // minutes
  reason: text("reason"),
  notes: text("notes"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  clinicianId: integer("clinician_id").references(() => users.id),
  visitDate: timestamp("visit_date").notNull(),
  visitType: text("visit_type").notNull(),
  status: text("status").$type<"scheduled" | "in_progress" | "completed">().default("scheduled"),
  notes: text("notes"),
  formData: jsonb("form_data"),
  formStatus: text("form_status").$type<"draft" | "signed" | "completed" | "needs_correction" | "locked">().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientStaffAssignments = pgTable("patient_staff_assignments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  staffId: integer("staff_id").notNull().references(() => users.id),
  assignedById: integer("assigned_by_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").unique().notNull(),
  patientId: integer("patient_id").notNull(),
  visitDate: timestamp("visit_date").notNull(),
  doctorId: integer("doctor_id"),
  diagnosis: text("diagnosis"),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  prescription: json("prescription").$type<{
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    instructions: string;
  }>(),
  vitalSigns: json("vital_signs").$type<{
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
  }>(),
  labResults: json("lab_results"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  prescriptionId: text("prescription_id").unique().notNull(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  instructions: text("instructions"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  refills: integer("refills").default(0),
  status: text("status").$type<"active" | "completed" | "cancelled">().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insurances = pgTable("insurances", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Other"),
  code: text("code"),
  phone: text("phone"),
  street: text("street"),
  city: text("city"),
  state: text("state").default("CA"),
  zipCode: text("zip_code"),
  // Billing identity
  billType: text("bill_type").notNull().default("UB04"),
  insuranceType: text("insurance_type"),
  financialClass: text("financial_class"),
  payorSubmitterId: text("payor_submitter_id"),
  providerNumber: text("provider_number"),
  payorType: text("payor_type"),
  // Billing behavior
  billMethod: text("bill_method").notNull().default("Normal"),
  ppsBilling: boolean("pps_billing").notNull().default(false),
  ewRequired: boolean("ew_required").notNull().default(false),
  timelyFilingDays: integer("timely_filing_days"),
  // Billing requirements
  authRequired: boolean("auth_required").notNull().default(false),
  requiresPlanOfCare: boolean("requires_plan_of_care").notNull().default(false),
  requiresHippsCode: boolean("requires_hipps_code").notNull().default(false),
  vbpPpsAdjust: boolean("vbp_pps_adjust").notNull().default(false),
  // EDI / 837i configuration
  ediReceiverId: text("edi_receiver_id"),
  ediReceiverQualifier: text("edi_receiver_qualifier").default("ZZ"),
  ediReceiverName: text("edi_receiver_name"),
  sbrPayorQualifier: text("sbr_payor_qualifier"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const physicians = pgTable("physicians", {
  id: serial("id").primaryKey(),
  code: text("code"),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  title: text("title"),
  street: text("street"),
  suite: text("suite"),
  city: text("city"),
  state: text("state").default("CA"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  upin: text("upin"),
  npi: text("npi"),
  pecosStatus: text("pecos_status").$type<"Enrolled" | "Not Enrolled" | "Unknown" | "Pending">().default("Unknown"),
  partB: boolean("part_b").default(false),
  dme: boolean("dme").default(false),
  hha: boolean("hha").default(false),
  pmd: boolean("pmd").default(false),
  hospice: boolean("hospice").default(false),
  lastChecked: text("last_checked"),
  protocol: text("protocol"),
  licenseNumber: text("license_number"),
  licenseState: text("license_state").default("CA"),
  licenseExpiration: text("license_expiration"),
  externalId: text("external_id"),
  agencyId: text("agency_id"),
  physicianType: text("physician_type").$type<
    | "Cardiologist" | "Dentist" | "Dermatologist" | "Endocrinologist"
    | "Family Practice" | "Gastroenterologist" | "Gerontologist" | "Hematologist"
    | "Internal Medicine" | "Medical Director" | "Nephrologist" | "Neurologist"
    | "Oncologist" | "Orthopedist" | "Physiatrist" | "Psychiatrist"
    | "Pulmonologist" | "Rheumatologist" | "Urologist" | "Other"
  >(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const icdCodes = pgTable("icd_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Other"),
  displayOrder: integer("display_order").notNull().default(99),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  code: text("code"),
  name: text("name").notNull(),
  vendorType: text("vendor_type")
    .$type<"Pharmacy" | "DME/Supply" | "Both">()
    .notNull()
    .default("Both"),
  street: text("street"),
  city: text("city"),
  state: text("state").default("CA"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  fax: text("fax"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  episodeNumber: integer("episode_number").notNull().default(1),
  chartNumber: text("chart_number"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  actualEnd: date("actual_end"),
  fbvAccrual: date("fbv_accrual"),
  finalBill: date("final_bill"),
  held: boolean("held").notNull().default(false),
  pep: boolean("pep").notNull().default(false),
  hippsFlag: boolean("hipps_flag").notNull().default(false),
  medicaid: boolean("medicaid").notNull().default(false),
  docStatus: text("doc_status").$type<"docs_not_rcvd" | "all_docs_rcvd">().notNull().default("docs_not_rcvd"),
  admitNumber: text("admit_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referrers = pgTable("referrers", {
  id: serial("id").primaryKey(),
  code: text("code"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name"),
  title: text("title"),
  street: text("street"),
  suite: text("suite"),
  city: text("city"),
  state: text("state").default("CA"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  externalId: text("external_id"),
  protocol: text("protocol"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const irodsAssessments = pgTable("irods_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  completedById: integer("completed_by_id").notNull().references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  responses: jsonb("responses").$type<number[]>(),
  rawScore: integer("raw_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const billingCodes = pgTable("billing_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }),
  rateType: text("rate_type").$type<"per_hour" | "per_visit">(),
  revCode: text("rev_code"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const oasisAssessments = pgTable("oasis_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  episodeId: integer("episode_id").references(() => episodes.id),
  completedById: integer("completed_by_id").references(() => users.id),
  assessDate: date("assess_date").notNull(),
  rfaCode: integer("rfa_code").notNull().default(4),
  assessmentReason: text("assessment_reason").notNull().default("OASIS v3-E RFA 4 Followup"),
  hippsCode: text("hipps_code"),
  hhrgCode: text("hhrg_code"),
  status: text("status").$type<"completed" | "locked_awaiting_export" | "exported">().notNull().default("completed"),
  exportFileName: text("export_file_name"),
  exportedAt: timestamp("exported_at"),
  iqiesSubmissionId: text("iqies_submission_id"),
  iqiesAsmtId: text("iqies_asmt_id"),
  correctionNum: integer("correction_num").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mdOrders = pgTable("md_orders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  episodeId: integer("episode_id").references(() => episodes.id),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  orderType: text("order_type").$type<"verbal" | "non_verbal">().notNull().default("verbal"),
  documentType: text("document_type").notNull().default("485"),
  physicianId: integer("physician_id").references(() => physicians.id),
  printed: boolean("printed").notNull().default(false),
  verbalReceivedBy: text("verbal_received_by"),
  verbalReceivedFrom: text("verbal_received_from"),
  verbalReadBack: boolean("verbal_read_back").default(false),
  dateReceived: date("date_received"),
  timeReceived: text("time_received"),
  effectiveDate: date("effective_date"),
  clinicalNotes: text("clinical_notes"),
  visitFrequency: jsonb("visit_frequency").$type<{ discipline: string; frequency: string }[]>(),
  interventions: text("interventions"),
  infusionInterventions: text("infusion_interventions"),
  status: text("status").$type<"draft" | "sent_to_md" | "signed" | "expired">().notNull().default("draft"),
  signedById: integer("signed_by_id").references(() => users.id),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const charges = pgTable("charges", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").references(() => visits.id),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  clinicianId: integer("clinician_id").references(() => users.id),
  claimId: integer("claim_id").references(() => claims.id),
  chargeDate: date("charge_date").notNull(),
  chargeCode: text("charge_code").notNull(),
  quantity: integer("quantity").notNull().default(1),
  visitTime: numeric("visit_time", { precision: 5, scale: 2 }),
  billedAmount: numeric("billed_amount", { precision: 10, scale: 2 }),
  miles: numeric("miles", { precision: 7, scale: 2 }),
  payRate: text("pay_rate"),
  verified: boolean("verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  insuranceId: integer("insurance_id").references(() => insurances.id),
  visitId: integer("visit_id").references(() => visits.id),
  claimNumber: text("claim_number"),
  status: text("status").$type<"draft" | "submitted" | "accepted" | "rejected" | "paid" | "void">().notNull().default("draft"),
  submittedDate: date("submitted_date"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  icn: text("icn"),
  tobCode: text("tob_code").default("329"),
  hippsCode: text("hipps_code"),
  billingCodesJson: jsonb("billing_codes_json").$type<{ code: string; description: string; units: number; amount: number }[]>(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  // PDGM / PPS calculation fields
  caseWeight:      numeric("case_weight",      { precision: 10, scale: 7 }),
  wageIndex:       numeric("wage_index",       { precision: 10, scale: 6 }),
  cbsaCode:        text("cbsa_code"),
  eepAmount:       numeric("eep_amount",       { precision: 12, scale: 2 }),
  outlierAmount:   numeric("outlier_amount",   { precision: 12, scale: 2 }),
  sequesterAmount: numeric("sequester_amount", { precision: 12, scale: 2 }),
  finalPosted:     numeric("final_posted",     { precision: 12, scale: 2 }),
  ppsNotes:        text("pps_notes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().references(() => claims.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  payer: text("payer"),
  paymentType: text("payment_type").$type<"check" | "ach" | "era" | "other">().notNull().default("other"),
  checkNumber: text("check_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  hours: numeric("hours", { precision: 8, scale: 2 }),
  visitsCount: integer("visits_count"),
  rate: numeric("rate", { precision: 10, scale: 2 }),
  rateType: text("rate_type").$type<"hourly" | "per_visit" | "salary">().notNull().default("per_visit"),
  total: numeric("total", { precision: 10, scale: 2 }),
  status: text("status").$type<"draft" | "approved" | "paid">().notNull().default("draft"),
  payDate: date("pay_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const patientLogs = pgTable("patient_logs", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  logDate: date("log_date").notNull(),
  entry: text("entry").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log (HIPAA) – table created via scripts/001-create-audit-log.sql
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  tableName: text("table_name"),
  recordId: integer("record_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduleOverrides = pgTable(
  "schedule_overrides",
  {
    id:         serial("id").primaryKey(),
    patientId:  integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    discipline: text("discipline").notNull(),
    weekStart:  date("week_start").notNull(),
    dayIndices: integer("day_indices").array().notNull(),
    updatedAt:  timestamp("updated_at").defaultNow(),
  },
  t => [unique("uq_schedule_override").on(t.patientId, t.discipline, t.weekStart)]
);

// Relations
export const patientsRelations = relations(patients, ({ one, many }) => ({
  owner: one(users, {
    fields: [patients.ownerId],
    references: [users.id],
  }),
  appointments: many(appointments),
  visits: many(visits),
  mdOrders: many(mdOrders),
  episodes: many(episodes),
  irodsAssessments: many(irodsAssessments),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
  staffAssignments: many(patientStaffAssignments),
  claims: many(claims),
  logs: many(patientLogs),
  documents: many(patientDocuments),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  patient: one(patients, {
    fields: [episodes.patientId],
    references: [patients.id],
  }),
  assessments: many(oasisAssessments),
  orders: many(mdOrders),
}));

export const oasisAssessmentsRelations = relations(oasisAssessments, ({ one }) => ({
  patient: one(patients, { fields: [oasisAssessments.patientId], references: [patients.id] }),
  episode: one(episodes, { fields: [oasisAssessments.episodeId], references: [episodes.id] }),
  completedBy: one(users, { fields: [oasisAssessments.completedById], references: [users.id] }),
}));

export const irodsAssessmentsRelations = relations(irodsAssessments, ({ one }) => ({
  patient: one(patients, {
    fields: [irodsAssessments.patientId],
    references: [patients.id],
  }),
  completedBy: one(users, {
    fields: [irodsAssessments.completedById],
    references: [users.id],
  }),
}));

export const mdOrdersRelations = relations(mdOrders, ({ one }) => ({
  patient: one(patients, {
    fields: [mdOrders.patientId],
    references: [patients.id],
  }),
  episode: one(episodes, {
    fields: [mdOrders.episodeId],
    references: [episodes.id],
  }),
  physician: one(physicians, {
    fields: [mdOrders.physicianId],
    references: [physicians.id],
  }),
  createdBy: one(users, {
    fields: [mdOrders.createdById],
    references: [users.id],
  }),
  signedBy: one(users, {
    fields: [mdOrders.signedById],
    references: [users.id],
  }),
}));

export const patientStaffAssignmentsRelations = relations(patientStaffAssignments, ({ one }) => ({
  patient: one(patients, {
    fields: [patientStaffAssignments.patientId],
    references: [patients.id],
  }),
  staff: one(users, {
    fields: [patientStaffAssignments.staffId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [patientStaffAssignments.assignedById],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  owner: one(users, {
    fields: [appointments.ownerId],
    references: [users.id],
  }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
  owner: one(users, {
    fields: [medicalRecords.ownerId],
    references: [users.id],
  }),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  clinician: one(users, {
    fields: [visits.clinicianId],
    references: [users.id],
  }),
  claims: many(claims),
}));

export const chargesRelations = relations(charges, ({ one }) => ({
  patient: one(patients, { fields: [charges.patientId], references: [patients.id] }),
  clinician: one(users, { fields: [charges.clinicianId], references: [users.id] }),
  visit: one(visits, { fields: [charges.visitId], references: [visits.id] }),
  claim: one(claims, { fields: [charges.claimId], references: [claims.id] }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  patient: one(patients, {
    fields: [claims.patientId],
    references: [patients.id],
  }),
  insurance: one(insurances, {
    fields: [claims.insuranceId],
    references: [insurances.id],
  }),
  visit: one(visits, {
    fields: [claims.visitId],
    references: [visits.id],
  }),
  payments: many(payments),
  charges: many(charges),
}));

export const patientLogsRelations = relations(patientLogs, ({ one }) => ({
  patient: one(patients, { fields: [patientLogs.patientId], references: [patients.id] }),
  user: one(users, { fields: [patientLogs.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  claim: one(claims, {
    fields: [payments.claimId],
    references: [claims.id],
  }),
}));

export const payrollRelations = relations(payroll, ({ one }) => ({
  user: one(users, {
    fields: [payroll.userId],
    references: [users.id],
  }),
}));

export const patientDocuments = pgTable("patient_documents", {
  id:           serial("id").primaryKey(),
  patientId:    integer("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  episodeId:    integer("episode_id").references(() => episodes.id, { onDelete: "set null" }),
  category:     text("category").notNull().default("NonCategory"),
  displayName:  text("display_name").notNull(),
  fileName:     text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType:     text("file_type").notNull(),
  fileSize:     integer("file_size").notNull().default(0),
  docDate:      date("doc_date").notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
});

export const patientDocumentsRelations = relations(patientDocuments, ({ one }) => ({
  patient:    one(patients,  { fields: [patientDocuments.patientId],    references: [patients.id] }),
  episode:    one(episodes,  { fields: [patientDocuments.episodeId],    references: [episodes.id] }),
  uploadedBy: one(users,     { fields: [patientDocuments.uploadedById], references: [users.id] }),
}));