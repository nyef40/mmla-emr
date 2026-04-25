-- Add owner_id to patients for PT ownership (existing DBs that were created before this column existed)
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "owner_id" integer;

-- Backfill: set owner_id to first admin/staff user (id 1) for existing rows; replace 1 with a valid user id if needed
UPDATE "patients" SET "owner_id" = 1 WHERE "owner_id" IS NULL;

ALTER TABLE "patients" ALTER COLUMN "owner_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_owner_id_users_id_fk"
    FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
