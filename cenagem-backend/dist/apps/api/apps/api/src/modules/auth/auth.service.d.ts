import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infrastructure/database';
import { AuditService } from '../audit/audit.service';
import { UploadTicketsService } from '../attachments/upload-tickets.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { UploadTicketLoginResponseDto } from './dto/upload-ticket-login.response';
interface AuthContext {
    ip?: string | string[];
    userAgent?: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly uploadTickets;
    private readonly auditService;
    constructor(prisma: PrismaService, usersService: UsersService, jwtService: JwtService, configService: ConfigService, uploadTickets: UploadTicketsService, auditService: AuditService);
    login(credentials: LoginDto, context: AuthContext): Promise<TokenPairDto>;
    refresh(refreshToken: string, context: AuthContext): Promise<TokenPairDto>;
    exchangeUploadTicket(ticketValue: string, context: AuthContext): Promise<UploadTicketLoginResponseDto>;
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
    private get uploadTicketAccessTokenTtl();
    private get refreshTokenTtl();
    private get refreshSecret();
    private decodeToken;
}
export {};
