-- CreateTable
CREATE TABLE "UploadTicket" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "memberId" TEXT,
    "createdById" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadTicket_familyId_idx" ON "UploadTicket"("familyId");

-- CreateIndex
CREATE INDEX "UploadTicket_memberId_idx" ON "UploadTicket"("memberId");

-- CreateIndex
CREATE INDEX "UploadTicket_createdById_idx" ON "UploadTicket"("createdById");

-- CreateIndex
CREATE INDEX "UploadTicket_expiresAt_idx" ON "UploadTicket"("expiresAt");

-- CreateIndex
CREATE INDEX "UploadTicket_revokedAt_idx" ON "UploadTicket"("revokedAt");

-- AddForeignKey
ALTER TABLE "UploadTicket" ADD CONSTRAINT "UploadTicket_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadTicket" ADD CONSTRAINT "UploadTicket_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadTicket" ADD CONSTRAINT "UploadTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
