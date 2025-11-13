import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Permission, UserStatus } from '@prisma/client';
import { ActiveUserData } from '@common';
import { UsersService } from '../../users/users.service';
import type { UserWithRoles } from '../../users/users.service';
import { AccessTokenPayload } from '../auth.types';

type UserRoleRelation = UserWithRoles['roles'][number];

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const accessSecret = configService.get<string>('auth.access.secret');

    if (!accessSecret) {
      throw new Error(
        'Missing auth.access.secret. Configure JWT_ACCESS_SECRET via your KeyVault/KMS workflow.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<ActiveUserData> {
    const user = await this.usersService.findByIdWithRoles(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const roles = user.roles.map(({ role }: UserRoleRelation) => role.name);
    const permissions = Array.from(
      new Set<Permission>(
        user.roles.flatMap(({ role }: UserRoleRelation) => role.permissions),
      ),
    );

    return {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
      sessionId: payload.sessionId,
      scope: (payload.scope as 'standard' | 'upload-ticket') ?? 'standard',
      uploadTicketId: payload.ticketId ?? null,
      uploadTicketFamilyId: payload.ticketFamilyId ?? null,
      uploadTicketMemberId: payload.ticketMemberId ?? null,
    };
  }
}
