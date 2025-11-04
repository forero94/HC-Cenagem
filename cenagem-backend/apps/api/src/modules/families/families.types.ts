import {
  AppointmentStatus,
  AttachmentCategory,
  FamilyStatus,
  StudyStatus,
  StudyType,
} from '@prisma/client';

export interface FamilyCounts {
  members: number;
  appointments: number;
  studies: number;
  attachments: number;
  evolutions: number;
  uploadTickets: number;
}

export interface FamilyMemberPreview {
  id: string;
  role?: string | null;
  initials?: string | null;
  displayName?: string | null;
  documentNumber?: string | null;
}

export interface FamilyDto {
  id: string;
  code: string;
  status: FamilyStatus;
  displayName?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  tags: string[];
  motive?: {
    groupId?: string | null;
    groupLabel?: string | null;
    detailId?: string | null;
    detailLabel?: string | null;
    notes?: string | null;
  };
  motiveNarrative?: string | null;
  motivePatient?: string | null;
  motiveDerivation?: string | null;
  contactInfo?: Record<string, unknown> | null;
  consanguinity?: Record<string, unknown> | null;
  obstetricHistory?: Record<string, unknown> | null;
  grandparents?: Record<string, unknown> | null;
  intake?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  counts?: FamilyCounts;
  membersPreview?: FamilyMemberPreview[];
}

export interface FamilyMemberDto {
  id: string;
  familyId: string;
  role?: string | null;
  initials?: string | null;
  relationship?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  birthDate?: Date | null;
  sex?: string | null;
  occupation?: string | null;
  schoolingLevel?: string | null;
  diagnosis?: string | null;
  summary?: string | null;
  contacto?: Record<string, unknown> | null;
  filiatorios?: Record<string, unknown> | null;
  antecedentes?: Record<string, unknown> | null;
  notes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyEvolutionDto {
  id: string;
  familyId: string;
  memberId: string;
  authorName?: string | null;
  authorEmail?: string | null;
  note: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | null;
}

export interface FamilyAppointmentDto {
  id: string;
  familyId?: string | null;
  memberId?: string | null;
  scheduledFor: Date;
  durationMins?: number | null;
  seatNumber?: number | null;
  motive?: string | null;
  notes?: string | null;
  status: AppointmentStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyStudyDto {
  id: string;
  familyId: string;
  memberId?: string | null;
  type: StudyType;
  status: StudyStatus;
  name: string;
  description?: string | null;
  requestedAt?: Date | null;
  resultAt?: Date | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyAttachmentDto {
  id: string;
  familyId: string;
  memberId?: string | null;
  studyId?: string | null;
  fileName: string;
  contentType?: string | null;
  size?: number | null;
  category: AttachmentCategory;
  description?: string | null;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyDetailDto extends FamilyDto {
  members: FamilyMemberDto[];
  evolutions: FamilyEvolutionDto[];
  appointments: FamilyAppointmentDto[];
  studies: FamilyStudyDto[];
  attachments: FamilyAttachmentDto[];
}
