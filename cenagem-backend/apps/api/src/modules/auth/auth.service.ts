import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Permission, UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { UsersService, UserWithRoles } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AccessTokenPayload, RefreshTokenPayload } from './auth.types';

interface AuthContext {
  ip?: string | string[];
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    credentials: LoginDto,
    context: AuthContext,
  ): Promise<TokenPairDto> {
    const user = await this.usersService.findByEmailWithRoles(
      credentials.email,
    );

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      credentials.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const sessionId = randomUUID();
    const tokenPair = await this.generateTokenPair(user, sessionId);

    await this.persistSession(
      sessionId,
      user.id,
      tokenPair.refreshToken,
      context,
    );

    await this.usersService.updateLastLogin(user.id);
    await this.auditService.log(user.id, 'auth.login', 'user', user.id, {
      ip: this.normalizeIp(context.ip),
      userAgent: context.userAgent,
    });

    return tokenPair;
  }

  async refresh(
    refreshToken: string,
    context: AuthContext,
  ): Promise<TokenPairDto> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException('Token de refresco inválido.');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Sesión no válida o expirada.');
    }

    const refreshMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!refreshMatches) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokedBy: session.userId },
      });
      throw new UnauthorizedException('Token de refresco inválido.');
    }

    const user = await this.usersService.findByIdWithRoles(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo.');
    }

    const tokenPair = await this.generateTokenPair(user, session.id);
    await this.replaceSessionRefreshToken(
      session.id,
      tokenPair.refreshToken,
      context,
    );

    await this.auditService.log(
      user.id,
      'auth.refresh',
      'session',
      session.id,
      {
        ip: this.normalizeIp(context.ip),
        userAgent: context.userAgent,
      },
    );

    return tokenPair;
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedBy: userId,
      },
    });

    if (result.count > 0) {
      await this.auditService.log(userId, 'auth.logout', 'session', sessionId);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedBy: userId,
      },
    });

    if (result.count > 0) {
      await this.auditService.log(userId, 'auth.logoutAll', 'session', null);
    }
  }

  private async generateTokenPair(
    user: UserWithRoles,
    sessionId: string,
  ): Promise<TokenPairDto> {
    const roles = user.roles.map((relation) => relation.role.name);
    const permissions = this.collectPermissions(user);

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
      sessionId,
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.accessTokenTtl,
    });

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sessionId,
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTokenTtl,
      jwtid: sessionId,
    } satisfies JwtSignOptions);

    const accessDecoded = this.decodeToken<AccessTokenPayload>(accessToken);
    const refreshDecoded = this.decodeToken<RefreshTokenPayload>(refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.secondsUntil(accessDecoded?.exp),
      refreshExpiresIn: this.secondsUntil(refreshDecoded?.exp),
    };
  }

  private async persistSession(
    sessionId: string,
    userId: string,
    refreshToken: string,
    context: AuthContext,
  ) {
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: await argon2.hash(refreshToken),
        userAgent: context.userAgent?.slice(0, 200) ?? null,
        ipAddress: this.normalizeIp(context.ip),
        expiresAt: this.tokenExpirationDate(refreshToken),
      },
    });
  }

  private async replaceSessionRefreshToken(
    sessionId: string,
    refreshToken: string,
    context: AuthContext,
  ) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken),
        userAgent: context.userAgent?.slice(0, 200) ?? null,
        ipAddress: this.normalizeIp(context.ip),
        expiresAt: this.tokenExpirationDate(refreshToken),
        revokedAt: null,
        revokedBy: null,
      },
    });
  }

  private tokenExpirationDate(token: string): Date {
    const decoded = this.decodeToken<RefreshTokenPayload>(token);
    if (!decoded?.exp) {
      throw new Error('El token no posee fecha de expiración.');
    }

    return new Date(decoded.exp * 1000);
  }

  private collectPermissions(user: UserWithRoles): Permission[] {
    const permissions = user.roles.flatMap(
      (relation) => relation.role.permissions,
    );
    return Array.from(new Set(permissions));
  }

  private secondsUntil(exp?: number): number {
    if (!exp) {
      return 0;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    return Math.max(0, exp - nowSeconds);
  }

  private normalizeIp(ip?: string | string[]): string | null {
    if (!ip) {
      return null;
    }

    if (Array.isArray(ip)) {
      return ip[0] ?? null;
    }

    return ip;
  }

  private get accessTokenTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('auth.access.expiresIn') ??
      '15m') as JwtSignOptions['expiresIn'];
  }

  private get refreshTokenTtl(): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('auth.refresh.expiresIn') ??
      '7d') as JwtSignOptions['expiresIn'];
  }

  private get refreshSecret(): string {
    return (
      this.configService.get<string>('auth.refresh.secret') ??
      'change-me-refresh'
    );
  }

  private decodeToken<T extends { exp?: number }>(token: string): T | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoded = this.jwtService.decode(token);
    if (!decoded || typeof decoded !== 'object') {
      return null;
    }

    return decoded as T;
  }
}
