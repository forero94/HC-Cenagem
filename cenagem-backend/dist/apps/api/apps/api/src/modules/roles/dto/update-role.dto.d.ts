import { Permission } from '@prisma/client';
export declare class UpdateRoleDto {
    description?: string;
    permissions?: Permission[];
    requiresLicense?: boolean;
}
