/**
 * One-off script: add owner_id to patients table (for existing DBs created before this column).
 * Run: npx tsx scripts/add-patients-owner-id.ts
 * Uses DATABASE_URL from .env. Backfills owner_id with user id 1; set BACKFILL_OWNER_ID=2 etc. to override.
 */
import "dotenv/config";
import { Pool } from "pg";

const backfillUserId = parseInt(process.env.BACKFILL_OWNER_ID ?? "1", 10);

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Adding owner_id to patients (if missing)...");
    await client.query('ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "owner_id" integer');
    console.log("Backfilling owner_id with user id", backfillUserId, "...");
    await client.query('UPDATE "patients" SET "owner_id" = $1 WHERE "owner_id" IS NULL', [backfillUserId]);
    await client.query('ALTER TABLE "patients" ALTER COLUMN "owner_id" SET NOT NULL');
    try {
      await client.query(
        'ALTER TABLE "patients" ADD CONSTRAINT "patients_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION'
      );
      console.log("Constraint added.");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err?.code === "42710") console.log("Constraint already exists.");
      else throw e;
    }
    console.log("Done. patients.owner_id is ready.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
