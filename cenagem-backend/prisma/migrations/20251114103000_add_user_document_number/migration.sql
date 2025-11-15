-- Add documentNumber column to User (nullable to avoid breaking existing rows)
ALTER TABLE "User"
ADD COLUMN "documentNumber" TEXT;
