import { Permission } from '@prisma/client';
export declare class CreateRoleDto {
    name: string;
    description?: string;
    permissions: Permission[];
    requiresLicense?: boolean;
}
