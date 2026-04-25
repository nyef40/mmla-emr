# Schema refactor (existing DBs)

If you already have a database created **before** the schema refactor (users had `is_admin`, appointments/medical_records had `created_by`), run the following SQL once instead of the full `0000_spooky_magus.sql` migration:

```sql
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_admin";
ALTER TABLE "appointments" RENAME COLUMN "created_by" TO "owner_id";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "medical_records" RENAME COLUMN "created_by" TO "owner_id";
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
```

## Adding `owner_id` to patients (PT ownership)

If your `patients` table does not have `owner_id` yet, run (replace `1` with a valid user id for existing rows):

```sql
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "owner_id" integer;
UPDATE "patients" SET "owner_id" = 1 WHERE "owner_id" IS NULL;
ALTER TABLE "patients" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "patients" ADD CONSTRAINT "patients_owner_id_users_id_fk"
  FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
```

- **New DB:** use `npm run db:migrate` (runs `0000_spooky_magus.sql`).
- **Existing DB:** run the SQL above manually, then mark migrations as applied if needed.
