import type { ActiveUserData } from '@common';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { UploadTicketLoginDto } from './dto/upload-ticket-login.dto';
import { UploadTicketLoginResponseDto } from './dto/upload-ticket-login.response';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(credentials: LoginDto, request: Request): Promise<TokenPairDto>;
    refresh(payload: RefreshTokenDto, request: Request): Promise<TokenPairDto>;
    loginWithUploadTicket(payload: UploadTicketLoginDto, request: Request): Promise<UploadTicketLoginResponseDto>;
    logout(user: ActiveUserData): Promise<void>;
    logoutAll(user: ActiveUserData): Promise<void>;
    private buildContext;
}
