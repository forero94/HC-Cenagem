import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@prisma/client';
import {
  ActiveUserData,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  ROLES_KEY,
  UPLOAD_TICKET_ALLOWED_KEY,
} from '@common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const uploadTicketAllowed = this.reflector.getAllAndOverride<boolean>(
      UPLOAD_TICKET_ALLOWED_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context
      .switchToHttp()
      .getRequest<{ user?: ActiveUserData }>();
    const user = request?.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.scope === 'upload-ticket') {
      if (!uploadTicketAllowed) {
        throw new ForbiddenException(
          'Este acceso sólo permite subir adjuntos específicos.',
        );
      }
      return true;
    }

    if (!requiredRoles && !requiredPermissions) {
      return true;
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
