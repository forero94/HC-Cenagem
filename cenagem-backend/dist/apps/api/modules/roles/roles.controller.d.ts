import type { ActiveUserData } from '@common';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    private readonly auditService;
    constructor(rolesService: RolesService, auditService: AuditService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
    }[]>;
    createRole(payload: CreateRoleDto, actor: ActiveUserData): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
    }>;
    updateRole(roleId: string, payload: UpdateRoleDto, actor: ActiveUserData): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
    }>;
    removeRole(roleId: string, actor: ActiveUserData): Promise<void>;
}
