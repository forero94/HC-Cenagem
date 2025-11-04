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
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    }[]>;
    findByName(name: string): Prisma.Prisma__RoleClient<{
        id: string;
        createdAt: Date;
        name: string;
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findManyByNames(names: string[]): Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        name: string;
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    }[]>;
    create(input: CreateRoleDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    }>;
    update(roleId: string, input: UpdateRoleDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    }>;
    remove(roleId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        permissions: import(".prisma/client").$Enums.Permission[];
        updatedAt: Date;
        description: string | null;
    }>;
}
