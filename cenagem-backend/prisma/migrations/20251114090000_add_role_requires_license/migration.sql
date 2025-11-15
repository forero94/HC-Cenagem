-- Add requiresLicense flag to roles to indicate if a matrícula/licence is mandatory
ALTER TABLE "Role"
ADD COLUMN "requiresLicense" BOOLEAN NOT NULL DEFAULT false;
