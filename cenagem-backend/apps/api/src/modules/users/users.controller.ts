import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser, Permissions } from '@common';
import type { ActiveUserData } from '@common';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserWithRoles, UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user: ActiveUserData) {
    const fullUser = await this.usersService.findByIdWithRoles(user.userId);
    if (!fullUser) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toResponse(fullUser);
  }

  @Get()
  @Permissions(Permission.USERS_VIEW)
  async listUsers() {
    const users = await this.usersService.listUsers();
    return users.map((user) => this.toResponse(user));
  }

  @Post()
  @Permissions(Permission.USERS_MANAGE)
  async createUser(
    @Body() input: CreateUserDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const user = await this.usersService.createUser(input, actor.userId);
    await this.auditService.log(actor.userId, 'user.create', 'user', user.id, {
      roles: user.roles.map((relation) => relation.role.name),
    });
    return this.toResponse(user);
  }

  @Patch(':id/status')
  @Permissions(Permission.USERS_MANAGE)
  async updateStatus(
    @Param('id') userId: string,
    @Body() payload: UpdateUserStatusDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const user = await this.usersService.updateStatus(userId, payload.status);
    await this.auditService.log(
      actor.userId,
      'user.updateStatus',
      'user',
      user.id,
      {
        status: payload.status,
      },
    );
    return this.toResponse(user);
  }

  @Patch(':id/roles')
  @Permissions(Permission.USERS_MANAGE)
  async updateRoles(
    @Param('id') userId: string,
    @Body() payload: UpdateUserRolesDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const user = await this.usersService.setUserRoles(
      userId,
      payload.roles,
      actor.userId,
    );
    await this.auditService.log(
      actor.userId,
      'user.updateRoles',
      'user',
      user.id,
      {
        roles: payload.roles,
      },
    );
    return this.toResponse(user);
  }

  private toResponse(user: UserWithRoles) {
    const roleRelations = user.roles;
    const roleNames = roleRelations.map((relation) => relation.role.name);
    const permissions = Array.from(
      new Set(roleRelations.flatMap((relation) => relation.role.permissions)),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: roleNames,
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
