-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('CASES_VIEW', 'CASES_MANAGE', 'USERS_VIEW', 'USERS_MANAGE', 'CATALOGUE_MANAGE', 'AUDIT_VIEW');

-- CreateEnum
CREATE TYPE "PatientSex" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "ClinicalCaseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('FATHER', 'MOTHER', 'TUTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsanguinityLevel" AS ENUM ('NO', 'POSIBLE', 'CONFIRMADA', 'DESCONOCIDO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "sex" "PatientSex",
    "province" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phonePrimary" TEXT,
    "phoneSecondary" TEXT,
    "occupation" TEXT,
    "schoolingLevel" TEXT,
    "schoolingPerformance" TEXT,
    "coverageProvider" TEXT,
    "coverageNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalCase" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caseCode" TEXT,
    "consultationDate" TIMESTAMP(3),
    "motiveGroup" TEXT,
    "motiveDetail" TEXT,
    "motiveNarrative" TEXT,
    "referralReason" TEXT,
    "assignedPhysicianId" TEXT,
    "status" "ClinicalCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalCaseAdministrative" (
    "caseId" TEXT NOT NULL,
    "companionName" TEXT,
    "companionRelation" TEXT,
    "primaryPhone" TEXT,
    "secondaryPhone" TEXT,
    "assignedPhysicianName" TEXT,
    "notes" TEXT,

    CONSTRAINT "ClinicalCaseAdministrative_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "ClinicalCaseGuardian" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "GuardianType" NOT NULL,
    "fullName" TEXT,
    "countryOfOrigin" TEXT,
    "consanguinity" "ConsanguinityLevel",
    "paternalSurname" TEXT,
    "paternalOrigin" TEXT,
    "maternalSurname" TEXT,
    "maternalOrigin" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,

    CONSTRAINT "ClinicalCaseGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalCaseClinical" (
    "caseId" TEXT NOT NULL,
    "behaviour" JSONB,
    "context" JSONB,
    "perinatal" JSONB,
    "anthropometry" JSONB,
    "physicalExam" JSONB,
    "development" JSONB,
    "metabolicScreening" JSONB,
    "prenatalFindings" JSONB,
    "reproductiveHistory" JSONB,
    "oncologyHistory" JSONB,
    "incidentalFinding" JSONB,
    "consanguinity" JSONB,
    "familyHistory" JSONB,
    "grandparents" JSONB,
    "summaryFirstConsult" TEXT,
    "firstEvolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalCaseClinical_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "ClinicalCaseComplementaryStudies" (
    "caseId" TEXT NOT NULL,
    "primerNivel" TEXT,
    "segundoNivel" TEXT,
    "tercerNivel" TEXT,
    "notas" TEXT,

    CONSTRAINT "ClinicalCaseComplementaryStudies_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "ClinicalCaseGroupSection" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalCaseGroupSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_refreshTokenHash_idx" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ClinicalCase_patientId_idx" ON "ClinicalCase"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalCase_caseCode_idx" ON "ClinicalCase"("caseCode");

-- CreateIndex
CREATE INDEX "ClinicalCase_motiveGroup_idx" ON "ClinicalCase"("motiveGroup");

-- CreateIndex
CREATE INDEX "ClinicalCaseGuardian_caseId_idx" ON "ClinicalCaseGuardian"("caseId");

-- CreateIndex
CREATE INDEX "ClinicalCaseGroupSection_sectionKey_idx" ON "ClinicalCaseGroupSection"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalCaseGroupSection_caseId_sectionKey_key" ON "ClinicalCaseGroupSection"("caseId", "sectionKey");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCase" ADD CONSTRAINT "ClinicalCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseAdministrative" ADD CONSTRAINT "ClinicalCaseAdministrative_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseGuardian" ADD CONSTRAINT "ClinicalCaseGuardian_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseClinical" ADD CONSTRAINT "ClinicalCaseClinical_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseComplementaryStudies" ADD CONSTRAINT "ClinicalCaseComplementaryStudies_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCaseGroupSection" ADD CONSTRAINT "ClinicalCaseGroupSection_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ClinicalCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
