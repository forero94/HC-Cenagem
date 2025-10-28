-- CreateEnum
CREATE TYPE "FamilyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'IN_ROOM', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('COMPLEMENTARY', 'GENETIC', 'OTHER');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('DOCUMENT', 'STUDY_RESULT', 'PHOTO', 'OTHER');

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT,
    "status" "FamilyStatus" NOT NULL DEFAULT 'ACTIVE',
    "province" TEXT,
    "city" TEXT,
    "address" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motiveGroup" TEXT,
    "motiveDetail" TEXT,
    "motiveNotes" TEXT,
    "motiveNarrative" TEXT,
    "motivePatient" TEXT,
    "motiveDerivation" TEXT,
    "contactInfo" JSONB,
    "consanguinity" JSONB,
    "obstetricHistory" JSONB,
    "grandparents" JSONB,
    "intake" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" TEXT,
    "givenName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "initials" TEXT,
    "relationship" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" "PatientSex",
    "occupation" TEXT,
    "schoolingLevel" TEXT,
    "diagnosis" TEXT,
    "summary" TEXT,
    "notes" JSONB,
    "filiatorios" JSONB,
    "antecedentes" JSONB,
    "contacto" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberEvolution" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "note" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "MemberEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER,
    "seatNumber" INTEGER,
    "motive" TEXT,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT,
    "type" "StudyType" NOT NULL DEFAULT 'OTHER',
    "status" "StudyStatus" NOT NULL DEFAULT 'REQUESTED',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requestedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "resultAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT,
    "studyId" TEXT,
    "uploadedById" TEXT,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "category" "AttachmentCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "content" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_code_key" ON "Family"("code");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "FamilyMember_initials_idx" ON "FamilyMember"("initials");

-- CreateIndex
CREATE INDEX "MemberEvolution_familyId_idx" ON "MemberEvolution"("familyId");

-- CreateIndex
CREATE INDEX "MemberEvolution_memberId_idx" ON "MemberEvolution"("memberId");

-- CreateIndex
CREATE INDEX "MemberEvolution_recordedAt_idx" ON "MemberEvolution"("recordedAt");

-- CreateIndex
CREATE INDEX "Appointment_familyId_idx" ON "Appointment"("familyId");

-- CreateIndex
CREATE INDEX "Appointment_memberId_idx" ON "Appointment"("memberId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledFor_idx" ON "Appointment"("scheduledFor");

-- CreateIndex
CREATE INDEX "Study_familyId_idx" ON "Study"("familyId");

-- CreateIndex
CREATE INDEX "Study_memberId_idx" ON "Study"("memberId");

-- CreateIndex
CREATE INDEX "Study_type_idx" ON "Study"("type");

-- CreateIndex
CREATE INDEX "Study_status_idx" ON "Study"("status");

-- CreateIndex
CREATE INDEX "Attachment_familyId_idx" ON "Attachment"("familyId");

-- CreateIndex
CREATE INDEX "Attachment_memberId_idx" ON "Attachment"("memberId");

-- CreateIndex
CREATE INDEX "Attachment_studyId_idx" ON "Attachment"("studyId");

-- CreateIndex
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");

-- CreateIndex
CREATE INDEX "Attachment_category_idx" ON "Attachment"("category");

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberEvolution" ADD CONSTRAINT "MemberEvolution_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberEvolution" ADD CONSTRAINT "MemberEvolution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Study" ADD CONSTRAINT "Study_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
