import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { randomBytes, randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { validationException } from '../src/common/validation-exception.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Helpdesk PostgreSQL API', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    const password = 'migration-e2e-password';
    const emails = [
        `nest-e2e-${randomUUID()}@example.test`,
        `nest-e2e-${randomUUID()}@example.test`,
    ];

    beforeAll(async () => {
        if (!process.env.DATABASE_URL_TEST) {
            throw new Error(
                'DATABASE_URL_TEST must target an isolated PostgreSQL test database/schema',
            );
        }
        process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
        process.env.JWT_SECRET = randomBytes(48).toString('base64url');
        const module = await Test.createTestingModule({
            imports: [AppModule],
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
        prisma = app.get(PrismaService);
        await app.init();
    });

    afterAll(async () => {
        if (!app) return;
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true },
        });
        const userIds = users.map((user) => user.id);
        await prisma.ticket.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.authSession.deleteMany({
            where: { userId: { in: userIds } },
        });
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
        await app.close();
    });

    it('persists auth, refresh rotation, ticket ownership, role visibility, and logout', async () => {
        await request(app.getHttpServer()).get('/api/user').expect(401);

        const first = await request(app.getHttpServer())
            .post('/api/register')
            .send({
                name: 'First E2E User',
                email: emails[0],
                password,
            })
            .expect(201);
        expect(first.body.role).toBe('user');
        expect(first.body).not.toHaveProperty('password');

        const firstLogin = await request(app.getHttpServer())
            .post('/api/login')
            .send({
                email: emails[0],
                password,
            })
            .expect(200);
        expect(firstLogin.body.token_type).toBe('Bearer');
        await request(app.getHttpServer())
            .get('/api/user')
            .set('Authorization', `Bearer ${firstLogin.body.token}`)
            .expect(200);

        const firstTicket = await request(app.getHttpServer())
            .post('/api/tickets')
            .set('Authorization', `Bearer ${firstLogin.body.token}`)
            .send({
                title: 'First ticket',
                description: 'First description',
                priority: 'high',
            })
            .expect(201);
        expect(firstTicket.body.data).toMatchObject({
            status: 'open',
            priority: 'high',
            user_id: first.body.id,
        });

        const second = await request(app.getHttpServer())
            .post('/api/register')
            .send({
                name: 'Second E2E User',
                email: emails[1],
                password,
            })
            .expect(201);
        expect(second.body.role).toBe('user');
        await prisma.user.update({
            where: { email: emails[1] },
            data: { role: 'support' },
        });
        const secondLogin = await request(app.getHttpServer())
            .post('/api/login')
            .send({
                email: emails[1],
                password,
            })
            .expect(200);
        await request(app.getHttpServer())
            .post('/api/tickets')
            .set('Authorization', `Bearer ${secondLogin.body.token}`)
            .send({
                title: 'Second ticket',
                description: 'Second description',
                priority: 'medium',
            })
            .expect(201);

        const ownTickets = await request(app.getHttpServer())
            .get('/api/tickets')
            .set('Authorization', `Bearer ${firstLogin.body.token}`)
            .expect(200);
        expect(ownTickets.body.data).toHaveLength(1);
        expect(ownTickets.body.data[0].id).toBe(firstTicket.body.data.id);
        expect(ownTickets.body.meta.per_page).toBe(15);

        const staffTickets = await request(app.getHttpServer())
            .get('/api/tickets?status=open')
            .set('Authorization', `Bearer ${secondLogin.body.token}`)
            .expect(200);
        expect(staffTickets.body.data).toHaveLength(2);

        const rotated = await request(app.getHttpServer())
            .post('/api/refresh')
            .send({ refresh_token: firstLogin.body.refresh_token })
            .expect(200);
        await request(app.getHttpServer())
            .post('/api/refresh')
            .send({ refresh_token: firstLogin.body.refresh_token })
            .expect(401);
        await request(app.getHttpServer())
            .post('/api/refresh')
            .send({ refresh_token: rotated.body.refresh_token })
            .expect(401);

        await request(app.getHttpServer())
            .post('/api/logout')
            .set('Authorization', `Bearer ${firstLogin.body.token}`)
            .expect(200, { message: 'Successfully logged out.' });
    });
});
