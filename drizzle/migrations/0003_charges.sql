CREATE TABLE IF NOT EXISTS "charges" (
  "id" serial PRIMARY KEY NOT NULL,
  "visit_id" integer,
  "patient_id" integer NOT NULL,
  "clinician_id" integer,
  "charge_date" date NOT NULL,
  "charge_code" text NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "visit_time" numeric(5, 2),
  "miles" numeric(7, 2),
  "pay_rate" text,
  "verified" boolean NOT NULL DEFAULT false,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "charges" ADD CONSTRAINT "charges_visit_id_visits_id_fk"
    FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "charges" ADD CONSTRAINT "charges_patient_id_patients_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "charges" ADD CONSTRAINT "charges_clinician_id_users_id_fk"
    FOREIGN KEY ("clinician_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
