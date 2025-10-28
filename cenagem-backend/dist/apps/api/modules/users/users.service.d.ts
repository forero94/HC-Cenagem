import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateUserDto } from './dto/create-user.dto';
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
    findByEmailWithRoles(email: string): Prisma.Prisma__UserClient<({
        roles: ({
            role: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                description: string | null;
                permissions: import(".prisma/client").$Enums.Permission[];
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
                updatedAt: Date;
                description: string | null;
                permissions: import(".prisma/client").$Enums.Permission[];
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
        status: import(".prisma/client").$Enums.UserStatus;
        passwordHash: string;
        lastLoginAt: Date | null;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    listUsers(): Promise<UserWithRoles[]>;
    createUser(input: CreateUserDto, actorId: string | null): Promise<UserWithRoles>;
    updateStatus(userId: string, status: UserStatus): Promise<UserWithRoles>;
    setUserRoles(userId: string, roleNames: string[], actorId: string | null): Promise<UserWithRoles>;
    updateLastLogin(userId: string): Promise<void>;
}
