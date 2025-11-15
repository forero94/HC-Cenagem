import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    }[]>;
    findByName(name: string): Prisma.Prisma__RoleClient<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findManyByNames(names: string[]): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    }[]>;
    create(input: CreateRoleDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    }>;
    update(roleId: string, input: UpdateRoleDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    }>;
    remove(roleId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        permissions: import(".prisma/client").$Enums.Permission[];
        requiresLicense: boolean;
    }>;
}
