import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CurrentUser, Permissions } from '@common';
import type { ActiveUserData } from '@common';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller({
  path: 'roles',
  version: '1',
})
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Permissions(Permission.USERS_VIEW)
  findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @Permissions(Permission.USERS_MANAGE)
  async createRole(
    @Body() payload: CreateRoleDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const role = await this.rolesService.create(payload);
    await this.auditService.log(actor.userId, 'role.create', 'role', role.id, {
      permissions: role.permissions,
    });
    return role;
  }

  @Patch(':id')
  @Permissions(Permission.USERS_MANAGE)
  async updateRole(
    @Param('id') roleId: string,
    @Body() payload: UpdateRoleDto,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const role = await this.rolesService.update(roleId, payload);
    await this.auditService.log(actor.userId, 'role.update', 'role', role.id, {
      permissions: payload.permissions,
    });
    return role;
  }

  @HttpCode(204)
  @Delete(':id')
  @Permissions(Permission.USERS_MANAGE)
  async removeRole(
    @Param('id') roleId: string,
    @CurrentUser() actor: ActiveUserData,
  ) {
    const role = await this.rolesService.remove(roleId);
    await this.auditService.log(actor.userId, 'role.delete', 'role', role.id);
    return;
  }
}
