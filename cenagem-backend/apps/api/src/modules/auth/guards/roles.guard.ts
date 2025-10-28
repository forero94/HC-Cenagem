import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@prisma/client';
import { ActiveUserData, PERMISSIONS_KEY, ROLES_KEY } from '@common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: ActiveUserData }>();
    const user = request?.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some((role) => user.roles.includes(role));
      if (!hasRole) {
        return false;
      }
    }

    if (requiredPermissions?.length) {
      const userPermissions = new Set(user.permissions);
      const hasPermissions = requiredPermissions.every((permission) =>
        userPermissions.has(permission),
      );

      if (!hasPermissions) {
        return false;
      }
    }

    return true;
  }
}
