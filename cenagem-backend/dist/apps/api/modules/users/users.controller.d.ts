import type { ActiveUserData } from '@common';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    private readonly auditService;
    constructor(usersService: UsersService, auditService: AuditService);
    getProfile(user: ActiveUserData): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: string[];
        permissions: import(".prisma/client").$Enums.Permission[];
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    listUsers(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: string[];
        permissions: import(".prisma/client").$Enums.Permission[];
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }[]>;
    createUser(input: CreateUserDto, actor: ActiveUserData): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: string[];
        permissions: import(".prisma/client").$Enums.Permission[];
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateStatus(userId: string, payload: UpdateUserStatusDto, actor: ActiveUserData): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: string[];
        permissions: import(".prisma/client").$Enums.Permission[];
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    updateRoles(userId: string, payload: UpdateUserRolesDto, actor: ActiveUserData): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: import(".prisma/client").$Enums.UserStatus;
        roles: string[];
        permissions: import(".prisma/client").$Enums.Permission[];
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    private toResponse;
}
