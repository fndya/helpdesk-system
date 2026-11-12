import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from './current-user.js';

interface AuthRequest extends Request {
    user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthRequest>();
        const [scheme, token] = (request.headers.authorization ?? '').split(
            ' ',
        );
        if (scheme !== 'Bearer' || !token) throw this.unauthenticated();

        let claims: { sub?: string; sid?: string };
        try {
            claims = await this.jwt.verifyAsync<{ sub?: string; sid?: string }>(
                token,
                {
                    secret: this.secret(),
                },
            );
        } catch {
            throw this.unauthenticated();
        }
        if (!claims.sub || !claims.sid || !/^\d+$/.test(claims.sub))
            throw this.unauthenticated();
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(claims.sub) },
        });
        if (!user) throw this.unauthenticated();
        request.user = { ...user, sessionId: claims.sid };
        return true;
    }

    private secret(): string {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32)
            throw new Error('JWT_SECRET must contain at least 32 characters');
        return secret;
    }

    private unauthenticated() {
        return new HttpException(
            { message: 'Unauthenticated.' },
            HttpStatus.UNAUTHORIZED,
        );
    }
}
