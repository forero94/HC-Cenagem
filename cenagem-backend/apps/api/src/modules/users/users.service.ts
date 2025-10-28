import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@infrastructure/database';
import * as argon2 from 'argon2';
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

@Injectable()
export class UsersService {
  private readonly userInclude = {
    roles: {
      include: {
        role: true,
      },
    },
  } satisfies Prisma.UserInclude;

  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithRoles(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: this.userInclude,
    });
  }

  findByIdWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude,
    });
  }

  async listUsers(): Promise<UserWithRoles[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.userInclude,
    });
  }

  async createUser(
    input: CreateUserDto,
    actorId: string | null,
  ): Promise<UserWithRoles> {
    const email = input.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException(
        `El correo ${input.email} ya está registrado.`,
      );
    }

    const passwordHash = await argon2.hash(input.password);
    const roleNames = input.roles ?? [];

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });

      if (roleNames.length > 0) {
        const roles = await tx.role.findMany({
          where: { name: { in: roleNames } },
        });

        if (roles.length !== roleNames.length) {
          const foundNames = new Set(roles.map((role) => role.name));
          const missing = roleNames.filter((role) => !foundNames.has(role));

          throw new BadRequestException(
            `Roles no válidos: ${missing.join(', ')}`,
          );
        }

        await tx.userRole.createMany({
          data: roles.map((role) => ({
            userId: user.id,
            roleId: role.id,
            assignedBy: actorId ?? null,
          })),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: this.userInclude,
      });
    });
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserWithRoles> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { status },
        include: this.userInclude,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }

  async setUserRoles(
    userId: string,
    roleNames: string[],
    actorId: string | null,
  ): Promise<UserWithRoles> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const roles = await tx.role.findMany({
        where: { name: { in: roleNames } },
      });

      if (roles.length !== roleNames.length) {
        const foundNames = new Set(roles.map((role) => role.name));
        const missing = roleNames.filter((role) => !foundNames.has(role));

        throw new BadRequestException(
          `Roles no válidos: ${missing.join(', ')}`,
        );
      }

      await tx.userRole.deleteMany({ where: { userId } });

      if (roles.length) {
        await tx.userRole.createMany({
          data: roles.map((role) => ({
            userId,
            roleId: role.id,
            assignedBy: actorId ?? null,
          })),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: this.userInclude,
      });
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
