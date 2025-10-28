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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.access.secret') ?? 'change-me-access',
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
    };
  }
}
