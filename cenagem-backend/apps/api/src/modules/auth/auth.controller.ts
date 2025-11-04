import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@common';
import type { ActiveUserData } from '@common';
import type { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { UploadTicketLoginDto } from './dto/upload-ticket-login.dto';
import { UploadTicketLoginResponseDto } from './dto/upload-ticket-login.response';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() credentials: LoginDto,
    @Req() request: Request,
  ): Promise<TokenPairDto> {
    return this.authService.login(credentials, this.buildContext(request));
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() payload: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<TokenPairDto> {
    return this.authService.refresh(
      payload.refreshToken,
      this.buildContext(request),
    );
  }

  @Public()
  @Post('upload-ticket')
  async loginWithUploadTicket(
    @Body() payload: UploadTicketLoginDto,
    @Req() request: Request,
  ): Promise<UploadTicketLoginResponseDto> {
    return this.authService.exchangeUploadTicket(
      payload.ticket,
      this.buildContext(request),
    );
  }

  @HttpCode(204)
  @Post('logout')
  async logout(@CurrentUser() user: ActiveUserData): Promise<void> {
    await this.authService.logout(user.userId, user.sessionId);
  }

  @HttpCode(204)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: ActiveUserData): Promise<void> {
    await this.authService.logoutAll(user.userId);
  }

  private buildContext(request: Request) {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'] ?? 'unknown',
    };
  }
}
