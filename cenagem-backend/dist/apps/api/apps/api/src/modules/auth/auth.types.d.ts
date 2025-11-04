import { Permission } from '@prisma/client';
export interface AccessTokenPayload {
    sub: string;
    email: string;
    roles: string[];
    permissions: Permission[];
    sessionId: string;
    scope?: 'standard' | 'upload-ticket';
    ticketId?: string | null;
    ticketFamilyId?: string | null;
    ticketMemberId?: string | null;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    sub: string;
    sessionId: string;
    iat?: number;
    exp?: number;
    jti?: string;
}
