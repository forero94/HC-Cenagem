import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export type UserWithRoles = Prisma.UserGetPayload<{
    include: {
        roles: {
            include: {
                role: true;
            };
        };
    };
}>;
export declare class UsersService {
    private readonly prisma;
    private readonly userInclude;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Prisma.Prisma__UserClient<({
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                permissions: import(".prisma/client").$Enums.Permission[];
                updatedAt: Date;
                description: string | null;
                requiresLicense: boolean;
            };
        } & {
            userId: string;
            roleId: string;
            assignedBy: string | null;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        documentNumber: string | null;
        licenseNumber: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        passwordHash: string;
        lastLoginAt: Date | null;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByUsername(username: string): Prisma.Prisma__UserClient<({
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                permissions: import(".prisma/client").$Enums.Permission[];
                updatedAt: Date;
                description: string | null;
                requiresLicense: boolean;
            };
        } & {
            userId: string;
            roleId: string;
            assignedBy: string | null;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        documentNumber: string | null;
        licenseNumber: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        passwordHash: string;
        lastLoginAt: Date | null;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findByIdWithRoles(userId: string): Prisma.Prisma__UserClient<({
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                permissions: import(".prisma/client").$Enums.Permission[];
                updatedAt: Date;
                description: string | null;
                requiresLicense: boolean;
            };
        } & {
            userId: string;
            roleId: string;
            assignedBy: string | null;
            assignedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        email: string;
        firstName: string;
        lastName: string;
        documentNumber: string | null;
        licenseNumber: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        passwordHash: string;
        lastLoginAt: Date | null;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    listUsers(): Promise<UserWithRoles[]>;
    createUser(input: CreateUserDto, actorId: string | null): Promise<UserWithRoles>;
    updateStatus(userId: string, status: UserStatus): Promise<UserWithRoles>;
    setUserRoles(userId: string, roleNames: string[], actorId: string | null): Promise<UserWithRoles>;
    updateUser(userId: string, input: UpdateUserDto): Promise<UserWithRoles>;
    deleteUser(userId: string): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;
}
