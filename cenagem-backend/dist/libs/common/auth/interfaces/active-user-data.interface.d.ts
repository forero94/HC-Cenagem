import { Permission } from '@prisma/client';
export interface ActiveUserData {
    userId: string;
    email: string;
    roles: string[];
    permissions: Permission[];
    sessionId: string;
}
