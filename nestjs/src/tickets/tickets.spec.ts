import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { validationException } from '../common/validation-exception.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

describe('Tickets API', () => {
    let app: INestApplication<App>;
    let user: Record<string, unknown>;
    let prisma: {
        user: { findUnique: ReturnType<typeof vi.fn> };
        ticket: {
            create: ReturnType<typeof vi.fn>;
            findMany: ReturnType<typeof vi.fn>;
            count: ReturnType<typeof vi.fn>;
        };
    };
    const secret = 'test-secret-with-at-least-thirty-two-characters';

    beforeEach(async () => {
        process.env.JWT_SECRET = secret;
        user = {
            id: 4n,
            name: 'A User',
            email: 'a@example.com',
            password: 'not-used',
            role: 'user',
            createdAt: null,
            updatedAt: null,
        };
        const ticket = {
            id: 19n,
            title: 'Cannot sign in',
            description: 'The sign-in page rejects the password.',
            status: 'open',
            priority: 'high',
            userId: 4n,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        };
        prisma = {
            user: { findUnique: vi.fn(async () => user) },
            ticket: {
                create: vi.fn(async ({ data }) => ({ ...ticket, ...data })),
                findMany: vi.fn(async () => [ticket]),
                count: vi.fn(async () => 1),
            },
        };
        const module = await Test.createTestingModule({
            controllers: [TicketsController],
            providers: [
                TicketsService,
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

    async function bearer() {
        return new JwtService().signAsync(
            { sid: 'session-1' },
            { secret, subject: '4', expiresIn: '15m' },
        );
    }

    it('creates a ticket owned by the authenticated user with OPEN status', async () => {
        const token = await bearer();
        const response = await request(app.getHttpServer())
            .post('/api/tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Cannot sign in',
                description: 'The sign-in page rejects the password.',
                priority: 'high',
                status: 'closed',
                user_id: 999,
            })
            .expect(201);
        expect(prisma.ticket.create).toHaveBeenCalledWith({
            data: {
                title: 'Cannot sign in',
                description: 'The sign-in page rejects the password.',
                priority: 'high',
                status: 'open',
                userId: 4n,
            },
        });
        expect(response.body.data).toMatchObject({
            status: 'open',
            priority: 'high',
            user_id: 4,
        });
    });

    it('requires authentication and validates ticket fields', async () => {
        await request(app.getHttpServer())
            .post('/api/tickets')
            .send({})
            .expect(401);
        const token = await bearer();
        const response = await request(app.getHttpServer())
            .post('/api/tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: '', description: '', priority: 'urgent-ish' })
            .expect(422);
        expect(response.body.errors).toHaveProperty('priority');
        expect(response.body.errors).toHaveProperty('title');
        expect(response.body.errors).toHaveProperty('description');
    });

    it('scopes USER tickets to the owner and applies filters and Laravel pagination', async () => {
        const token = await bearer();
        const response = await request(app.getHttpServer())
            .get('/api/tickets?status=open&priority=high')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(prisma.ticket.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: 4n, status: 'open', priority: 'high' },
                orderBy: { createdAt: 'desc' },
                take: 15,
            }),
        );
        expect(response.body.data[0]).toMatchObject({
            id: 19,
            user_id: 4,
            status: 'open',
        });
        expect(response.body.meta).toMatchObject({
            current_page: 1,
            per_page: 15,
            total: 1,
        });
        expect(response.body.meta).not.toHaveProperty('next_page_url');
        expect(response.body.meta).not.toHaveProperty('prev_page_url');
        expect(response.body.data[0].created_at).toBe(
            '2026-01-01T00:00:00.000000Z',
        );
        expect(response.body.links).toHaveProperty('first');
    });

    it('preserves Laravel visibility for SUPPORT and ADMIN', async () => {
        const token = await bearer();
        for (const role of ['support', 'admin']) {
            (user as { role: string }).role = role;
            await request(app.getHttpServer())
                .get('/api/tickets')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(prisma.ticket.findMany).toHaveBeenLastCalledWith(
                expect.objectContaining({ where: {} }),
            );
        }
    });

    it('uses Laravel page-number validation and empty-page metadata', async () => {
        prisma.ticket.findMany.mockResolvedValue([]);
        prisma.ticket.count.mockResolvedValue(16);
        const token = await bearer();
        const response = await request(app.getHttpServer())
            .get('/api/tickets?page=3')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(prisma.ticket.findMany).toHaveBeenLastCalledWith(
            expect.objectContaining({ skip: 30, take: 15 }),
        );
        expect(response.body.meta).toMatchObject({
            current_page: 3,
            from: null,
            to: null,
        });

        await request(app.getHttpServer())
            .get('/api/tickets?page=2.0')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(prisma.ticket.findMany).toHaveBeenLastCalledWith(
            expect.objectContaining({ skip: 0, take: 15 }),
        );
    });
});
