import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  findManyByNames(names: string[]) {
    return this.prisma.role.findMany({
      where: { name: { in: names } },
    });
  }

  async create(input: CreateRoleDto) {
    const existing = await this.findByName(input.name);
    if (existing) {
      throw new BadRequestException(
        `El rol ${input.name} ya existe en el sistema.`,
      );
    }

    return this.prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        permissions: input.permissions,
      },
    });
  }

  async update(roleId: string, input: UpdateRoleDto) {
    const data: Prisma.RoleUpdateInput = {
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.permissions !== undefined && {
        permissions: { set: input.permissions },
      }),
    };

    if (Object.keys(data).length === 0) {
      return this.prisma.role.findUniqueOrThrow({ where: { id: roleId } });
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data,
    });
  }

  async remove(roleId: string) {
    return this.prisma.role.delete({
      where: { id: roleId },
    });
  }
}
