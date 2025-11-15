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

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: this.userInclude,
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { email: username.toLowerCase().trim() }, // Assuming 'email' field stores the username
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
    const username = input.username.toLowerCase().trim();
    const documentNumber = input.documentNumber?.trim() ?? '';
    if (!documentNumber) {
      throw new BadRequestException('El DNI es obligatorio.');
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: username }, // Still using 'email' column in DB for username
    });

    if (existing) {
      throw new BadRequestException(
        `El usuario ${input.username} ya está registrado.`,
      );
    }
    const passwordHash = await argon2.hash(input.password);
    const roleNames = input.roles ?? [];
    const trimmedLicense = input.licenseNumber?.trim() ?? '';
    const normalizedLicense =
      trimmedLicense.length > 0 ? trimmedLicense : null;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let roles: { id: string; name: string; requiresLicense: boolean }[] = [];

      if (roleNames.length > 0) {
        roles = await tx.role.findMany({
          where: { name: { in: roleNames } },
          select: {
            id: true,
            name: true,
            requiresLicense: true,
          },
        });

        if (roles.length !== roleNames.length) {
          const foundNames = new Set(roles.map((role) => role.name));
          const missing = roleNames.filter((role) => !foundNames.has(role));

          throw new BadRequestException(
            `Roles no válidos: ${missing.join(', ')}`,
          );
        }

        if (roles.some((role) => role.requiresLicense) && !normalizedLicense) {
          throw new BadRequestException(
            'Los roles seleccionados requieren una matrícula profesional registrada.',
          );
        }
      }

      const user = await tx.user.create({
        data: {
          email: username,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          documentNumber,
          licenseNumber: normalizedLicense,
        },
      });

      if (roles.length > 0) {
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
        select: {
          id: true,
          name: true,
          requiresLicense: true,
        },
      });

      if (roles.length !== roleNames.length) {
        const foundNames = new Set(roles.map((role) => role.name));
        const missing = roleNames.filter((role) => !foundNames.has(role));

        throw new BadRequestException(
          `Roles no válidos: ${missing.join(', ')}`,
        );
      }

      const needsLicense = roles.filter((role) => role.requiresLicense);
      const hasLicense =
        typeof user.licenseNumber === 'string' &&
        user.licenseNumber.trim().length > 0;
      if (needsLicense.length > 0 && !hasLicense) {
        throw new BadRequestException(
          `Los roles ${needsLicense
            .map((role) => role.name)
            .join(', ')} requieren una matrícula profesional registrada.`,
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

  async updateUser(
    userId: string,
    input: UpdateUserDto,
  ): Promise<UserWithRoles> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.userInclude,
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hasLicenseBoundRole = existing.roles.some(
      (relation) => relation.role.requiresLicense,
    );

    const data: Prisma.UserUpdateInput = {};
    let hasChanges = false;

    if (typeof input.username === 'string') {
      const normalized = input.username.trim().toLowerCase();
      if (!normalized) {
        throw new BadRequestException('El usuario no puede quedar vacío.');
      }
      data.email = normalized;
      hasChanges = true;
    }

    if (typeof input.firstName === 'string') {
      const trimmed = input.firstName.trim();
      if (!trimmed) {
        throw new BadRequestException('El nombre es obligatorio.');
      }
      data.firstName = trimmed;
      hasChanges = true;
    }

    if (typeof input.lastName === 'string') {
      const trimmed = input.lastName.trim();
      if (!trimmed) {
        throw new BadRequestException('El apellido es obligatorio.');
      }
      data.lastName = trimmed;
      hasChanges = true;
    }

    if (typeof input.documentNumber === 'string') {
      const trimmed = input.documentNumber.trim();
      if (!trimmed) {
        throw new BadRequestException('El DNI es obligatorio.');
      }
      data.documentNumber = trimmed;
      hasChanges = true;
    }

    if (typeof input.licenseNumber === 'string') {
      const trimmed = input.licenseNumber.trim();
      if (hasLicenseBoundRole && trimmed.length === 0) {
        throw new BadRequestException(
          'Los roles asignados requieren una matrícula profesional registrada.',
        );
      }
      data.licenseNumber = trimmed.length > 0 ? trimmed : null;
      hasChanges = true;
    }

    if (typeof input.password === 'string') {
      const passwordHash = await argon2.hash(input.password);
      data.passwordHash = passwordHash;
      hasChanges = true;
    }

    if (!hasChanges) {
      throw new BadRequestException('No hay cambios para aplicar.');
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        include: this.userInclude,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Usuario no encontrado');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('El usuario ya está en uso.');
        }
      }
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
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

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
