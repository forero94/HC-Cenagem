import { Permission } from '@prisma/client';

export interface ActiveUserData {
  userId: string;
  email: string;
  roles: string[];
  permissions: Permission[];
  sessionId: string;
  scope?: 'standard' | 'upload-ticket';
  uploadTicketId?: string | null;
  uploadTicketFamilyId?: string | null;
  uploadTicketMemberId?: string | null;
}
