// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean, integer, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password"), // Hashed password
  role: text("role").$type<"admin" | "staff" | "rn" | "pt">().default("staff"),
  isActive: boolean("is_active").default(true),
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
  status: text("status").default("scheduled"),
  notes: text("notes"),
  vitals: jsonb("vitals"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Relations
export const patientsRelations = relations(patients, ({ one, many }) => ({
  owner: one(users, {
    fields: [patients.ownerId],
    references: [users.id],
  }),
  appointments: many(appointments),
  visits: many(visits),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
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

export const visitsRelations = relations(visits, ({ one }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  clinician: one(users, {
    fields: [visits.clinicianId],
    references: [users.id],
  }),
}));