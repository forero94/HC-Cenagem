import type { ActiveUserData } from '@common';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(credentials: LoginDto, request: Request): Promise<TokenPairDto>;
    refresh(payload: RefreshTokenDto, request: Request): Promise<TokenPairDto>;
    logout(user: ActiveUserData): Promise<void>;
    logoutAll(user: ActiveUserData): Promise<void>;
    private buildContext;
}
