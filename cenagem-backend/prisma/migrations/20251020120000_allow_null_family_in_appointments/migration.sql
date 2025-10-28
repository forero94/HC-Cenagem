-- Allow appointments without an associated family (first consultations)
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_familyId_fkey";

ALTER TABLE "Appointment"
  ALTER COLUMN "familyId" DROP NOT NULL;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_familyId_fkey"
  FOREIGN KEY ("familyId") REFERENCES "Family"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
