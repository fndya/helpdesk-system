import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto.js';
import type { AuthenticatedUser } from './current-user.js';

interface AuthRequest extends Request {
    user: AuthenticatedUser;
}

@Controller()
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body() body: RegisterDto) {
        return this.auth.register(body);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() body: LoginDto) {
        return this.auth.login(body);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refresh(@Body() body: RefreshDto) {
        return this.auth.refresh(body.refresh_token);
    }

    @Get('user')
    @UseGuards(AuthGuard)
    me(@Req() request: AuthRequest) {
        return this.auth.me(request.user);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    logout(@Req() request: AuthRequest) {
        return this.auth.logout(request.user);
    }
}
