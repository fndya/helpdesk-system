import {
    Injectable,
    HttpException,
    HttpStatus,
    UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { serializeDate } from '../common/serialize-date.js';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import type { AuthenticatedUser } from './current-user.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async register(input: RegisterDto) {
        if (
            await this.prisma.user.findUnique({ where: { email: input.email } })
        ) {
            throw this.emailTaken();
        }
        try {
            const user = await this.prisma.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    password: await hash(input.password, 12),
                    role: 'user',
                },
            });
            return this.userResponse(user);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw this.emailTaken();
            }
            throw error;
        }
    }

    private emailTaken() {
        return new UnprocessableEntityException({
            message: 'The email has already been taken.',
            errors: { email: ['The email has already been taken.'] },
        });
    }

    async login(input: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (!user || !(await compare(input.password, user.password))) {
            throw new HttpException(
                { message: 'Invalid credentials.' },
                HttpStatus.UNAUTHORIZED,
            );
        }
        const session = await this.createSession(user.id);
        return {
            token: await this.accessToken(user.id, session.id),
            token_type: 'Bearer',
            refresh_token: session.token,
            user: this.userResponse(user),
        };
    }

    async refresh(token: string) {
        const tokenHash = this.tokenHash(token);
        const session = await this.prisma.authSession.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
        if (!session) throw this.unauthenticated();

        const now = new Date();
        if (session.revokedAt || session.expiresAt <= now) {
            if (session.revokedAt)
                await this.revokeFamily(session.familyId, now);
            throw this.unauthenticated();
        }

        const nextToken = this.newRefreshToken();
        const nextHash = this.tokenHash(nextToken);
        const expiresAt = new Date(now.getTime() + REFRESH_TTL_MS);
        const newSession = await this.prisma.$transaction(async (tx) => {
            const consumed = await tx.authSession.updateMany({
                where: {
                    id: session.id,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: { revokedAt: now },
            });
            if (!consumed.count) return null;
            return tx.authSession.create({
                data: {
                    userId: session.userId,
                    familyId: session.familyId,
                    tokenHash: nextHash,
                    expiresAt,
                },
            });
        });
        if (!newSession) {
            await this.revokeFamily(session.familyId, now);
            throw this.unauthenticated();
        }
        return {
            token: await this.accessToken(session.userId, newSession.id),
            token_type: 'Bearer',
            refresh_token: nextToken,
            user: this.userResponse(session.user),
        };
    }

    async logout(user: AuthenticatedUser) {
        const session = await this.prisma.authSession.findUnique({
            where: { id: user.sessionId },
        });
        if (session) await this.revokeFamily(session.familyId, new Date());
        return { message: 'Successfully logged out.' };
    }

    me(user: AuthenticatedUser) {
        return this.userResponse(user);
    }

    private async createSession(userId: bigint) {
        const token = this.newRefreshToken();
        const session = await this.prisma.authSession.create({
            data: {
                userId,
                familyId: randomUUID(),
                tokenHash: this.tokenHash(token),
                expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
            },
        });
        return { id: session.id, token };
    }

    private async accessToken(userId: bigint, sessionId: string) {
        return this.jwt.signAsync(
            { sid: sessionId },
            {
                secret: this.secret(),
                subject: userId.toString(),
                expiresIn: ACCESS_TTL,
            },
        );
    }

    private async revokeFamily(familyId: string, at: Date) {
        await this.prisma.authSession.updateMany({
            where: { familyId, revokedAt: null },
            data: { revokedAt: at },
        });
    }

    private newRefreshToken() {
        return randomBytes(32).toString('base64url');
    }

    private unauthenticated() {
        return new HttpException(
            { message: 'Unauthenticated.' },
            HttpStatus.UNAUTHORIZED,
        );
    }

    private tokenHash(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    private secret() {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32)
            throw new Error('JWT_SECRET must contain at least 32 characters');
        return secret;
    }

    private userResponse(user: {
        id: bigint;
        name: string;
        email: string;
        role: string;
        createdAt: Date | null;
        updatedAt: Date | null;
    }) {
        return {
            id: Number(user.id),
            name: user.name,
            email: user.email,
            created_at: serializeDate(user.createdAt),
            updated_at: serializeDate(user.updatedAt),
            role: user.role,
        };
    }
}
