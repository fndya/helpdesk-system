import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { hashSync } from 'bcryptjs';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { validationException } from '../common/validation-exception.js';

describe('Auth API', () => {
    let app: INestApplication<App>;
    let user: Record<string, unknown>;
    let prisma: {
        user: {
            findUnique: ReturnType<typeof vi.fn>;
            create: ReturnType<typeof vi.fn>;
        };
        authSession: {
            create: ReturnType<typeof vi.fn>;
            findUnique: ReturnType<typeof vi.fn>;
            updateMany: ReturnType<typeof vi.fn>;
        };
        $transaction: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        process.env.JWT_SECRET =
            'test-secret-with-at-least-thirty-two-characters';
        user = {
            id: 4n,
            name: 'A User',
            email: 'a@example.com',
            password: hashSync('password-123', 4).replace('$2b$', '$2y$'),
            role: 'user',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
        };
        prisma = {
            user: {
                findUnique: vi.fn(async ({ where }) =>
                    where.email
                        ? user.email === where.email
                            ? user
                            : null
                        : user,
                ),
                create: vi.fn(async ({ data }) => ({
                    ...user,
                    ...data,
                    id: 5n,
                    password: data.password,
                })),
            },
            authSession: {
                create: vi.fn(async ({ data }) => ({
                    id: 'session-1',
                    ...data,
                })),
                findUnique: vi.fn(async ({ where }) => ({
                    id: where.id ?? 'session-2',
                    familyId: 'family-1',
                    userId: 4n,
                    revokedAt: null,
                    expiresAt: new Date(Date.now() + 100000),
                    user,
                })),
                updateMany: vi.fn(async () => ({ count: 1 })),
            },
            $transaction: vi.fn(async (callback) =>
                callback({
                    authSession: {
                        updateMany: vi.fn(async () => ({ count: 1 })),
                        create: vi.fn(async ({ data }) => ({
                            id: 'session-2',
                            ...data,
                        })),
                    },
                }),
            ),
        };

        const module = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                AuthService,
                AuthGuard,
                JwtService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        app = module.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                exceptionFactory: validationException,
            }),
        );
        await app.init();
    });

    afterEach(async () => app.close());

    it('registers with the user role and never returns the password', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/register')
            .send({
                name: 'A User',
                email: 'new@example.com',
                password: 'password-123',
                role: 'admin',
            })
            .expect(201);
        expect(prisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    role: 'user',
                    email: 'new@example.com',
                }),
            }),
        );
        expect(response.body.role).toBe('user');
        expect(response.body).not.toHaveProperty('password');
    });

    it('validates registration and returns Laravel style 422 errors', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/register')
            .send({ name: 'A', email: 'bad', password: 'short' })
            .expect(422);
        expect(response.body).toMatchObject({
            message: 'The given data was invalid.',
            errors: expect.any(Object),
        });
        expect(response.body.errors.name).toContain(
            'The name field must be at least 2 characters.',
        );
    });

    it('rejects duplicate registration emails with 422', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/register')
            .send({
                name: 'Another User',
                email: 'a@example.com',
                password: 'password-123',
            })
            .expect(422);
        expect(response.body.errors.email).toContain(
            'The email has already been taken.',
        );
    });

    it('logs in against Laravel bcrypt hashes and returns access and refresh tokens', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/login')
            .send({ email: 'a@example.com', password: 'password-123' })
            .expect(200);
        expect(response.body).toMatchObject({
            token_type: 'Bearer',
            user: { email: 'a@example.com', role: 'user' },
        });
        expect(response.body.token).toEqual(expect.any(String));
        expect(response.body.refresh_token).toEqual(expect.any(String));
        expect(response.body.user).not.toHaveProperty('password');
        expect(prisma.authSession.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    tokenHash: expect.not.stringContaining(
                        response.body.refresh_token,
                    ),
                }),
            }),
        );
    });

    it('rejects bad credentials and blocks unauthenticated private routes', async () => {
        await request(app.getHttpServer())
            .post('/api/login')
            .send({ email: 'a@example.com', password: 'wrong-pass' })
            .expect(401);
        const emptyPassword = await request(app.getHttpServer())
            .post('/api/login')
            .send({ email: 'a@example.com', password: '' })
            .expect(422);
        expect(emptyPassword.body.errors.password).toEqual([
            'The password field is required.',
        ]);
        await request(app.getHttpServer()).get('/api/user').expect(401);
    });

    it('returns the database user for a valid access JWT and revokes its refresh family on logout', async () => {
        const login = await request(app.getHttpServer())
            .post('/api/login')
            .send({ email: 'a@example.com', password: 'password-123' })
            .expect(200);
        const me = await request(app.getHttpServer())
            .get('/api/user')
            .set('Authorization', `Bearer ${login.body.token}`)
            .expect(200);
        expect(me.body).toMatchObject({ id: 4, email: 'a@example.com' });
        await request(app.getHttpServer())
            .post('/api/logout')
            .set('Authorization', `Bearer ${login.body.token}`)
            .expect(200, { message: 'Successfully logged out.' });
        expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { familyId: 'family-1', revokedAt: null },
            }),
        );
    });

    it('rotates refresh tokens and revokes the family when a rotated token is reused', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/refresh')
            .send({ refresh_token: 'a'.repeat(43) })
            .expect(200);
        expect(response.body.refresh_token).not.toBe('a'.repeat(43));
        expect(prisma.$transaction).toHaveBeenCalledOnce();

        prisma.authSession.findUnique.mockResolvedValueOnce({
            id: 'session-old',
            familyId: 'family-reused',
            userId: 4n,
            revokedAt: new Date(),
            expiresAt: new Date(Date.now() + 100000),
            user,
        });
        await request(app.getHttpServer())
            .post('/api/refresh')
            .send({ refresh_token: 'b'.repeat(43) })
            .expect(401);
        expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { familyId: 'family-reused', revokedAt: null },
            }),
        );
    });
});
