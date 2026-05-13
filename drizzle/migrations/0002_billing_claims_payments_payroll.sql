CREATE TABLE IF NOT EXISTS "claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "patient_id" integer NOT NULL,
  "insurance_id" integer,
  "visit_id" integer,
  "claim_number" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "submitted_date" date,
  "billing_codes_json" jsonb,
  "total_amount" numeric(10, 2),
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "claim_id" integer NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "payment_date" date NOT NULL,
  "payer" text,
  "payment_type" text DEFAULT 'other' NOT NULL,
  "check_number" text,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payroll" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "hours" numeric(8, 2),
  "visits_count" integer,
  "rate" numeric(10, 2),
  "rate_type" text DEFAULT 'per_visit' NOT NULL,
  "total" numeric(10, 2),
  "status" text DEFAULT 'draft' NOT NULL,
  "pay_date" date,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "claims" ADD CONSTRAINT "claims_patient_id_patients_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "claims" ADD CONSTRAINT "claims_insurance_id_insurances_id_fk"
    FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "claims" ADD CONSTRAINT "claims_visit_id_visits_id_fk"
    FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payments" ADD CONSTRAINT "payments_claim_id_claims_id_fk"
    FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payroll" ADD CONSTRAINT "payroll_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
