import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infrastructure/database';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
interface AuthContext {
    ip?: string | string[];
    userAgent?: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly auditService;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService, auditService: AuditService);
    login(credentials: LoginDto, context: AuthContext): Promise<TokenPairDto>;
    refresh(refreshToken: string, context: AuthContext): Promise<TokenPairDto>;
    logout(userId: string, sessionId: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    private generateTokenPair;
    private persistSession;
    private replaceSessionRefreshToken;
    private tokenExpirationDate;
    private collectPermissions;
    private secondsUntil;
    private normalizeIp;
    private get accessTokenTtl();
    private get refreshTokenTtl();
    private get refreshSecret();
    private decodeToken;
}
export {};
