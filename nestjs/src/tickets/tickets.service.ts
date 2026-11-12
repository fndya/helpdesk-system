import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/current-user.js';
import type { CreateTicketDto, ListTicketsDto } from './ticket.dto.js';
import { serializeDate } from '../common/serialize-date.js';

const PER_PAGE = 15;

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(user: AuthenticatedUser, input: CreateTicketDto) {
        const ticket = await this.prisma.ticket.create({
            data: {
                title: input.title,
                description: input.description,
                priority: input.priority,
                status: 'open',
                userId: user.id,
            },
        });
        return { data: this.ticketResponse(ticket) };
    }

    async list(
        user: AuthenticatedUser,
        filters: ListTicketsDto,
        request: Request,
    ) {
        const requestUrl = new URL(
            `${request.protocol}://${request.get('host')}${request.originalUrl}`,
        );
        const pageParameter = requestUrl.searchParams.get('page') ?? '1';
        const pageValue = /^\d+$/.test(pageParameter)
            ? Number(pageParameter)
            : 1;
        const page =
            Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
        const where = {
            ...(user.role === 'user' ? { userId: user.id } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.priority ? { priority: filters.priority } : {}),
        };
        const [tickets, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * PER_PAGE,
                take: PER_PAGE,
            }),
            this.prisma.ticket.count({ where }),
        ]);

        return this.paginationResponse(tickets, total, page, request);
    }

    private paginationResponse(
        tickets: Array<{
            id: bigint;
            title: string;
            description: string;
            status: string;
            priority: string;
            userId: bigint;
            createdAt: Date | null;
            updatedAt: Date | null;
        }>,
        total: number,
        page: number,
        request: Request,
    ) {
        const lastPage = Math.max(Math.ceil(total / PER_PAGE), 1);
        const base = new URL(
            `${request.protocol}://${request.get('host')}${request.path}`,
        );
        base.search = '';
        const url = (pageNumber: number) => {
            const target = new URL(base);
            target.searchParams.set('page', String(pageNumber));
            return target.toString();
        };
        const pages: Array<number | null> =
            lastPage < 14
                ? Array.from(
                      { length: lastPage },
                      (_unused, index) => index + 1,
                  )
                : page <= 7
                  ? [
                        ...Array.from(
                            { length: 10 },
                            (_unused, index) => index + 1,
                        ),
                        null,
                        lastPage - 1,
                        lastPage,
                    ]
                  : page > lastPage - 7
                    ? [
                          1,
                          2,
                          null,
                          ...Array.from(
                              { length: 10 },
                              (_unused, index) => lastPage - 9 + index,
                          ),
                      ]
                    : [
                          1,
                          2,
                          null,
                          ...Array.from(
                              { length: 7 },
                              (_unused, index) => page - 3 + index,
                          ),
                          null,
                          lastPage - 1,
                          lastPage,
                      ];
        const previousUrl = page > 1 ? url(page - 1) : null;
        const nextUrl = page < lastPage ? url(page + 1) : null;
        const from = tickets.length ? (page - 1) * PER_PAGE + 1 : null;
        const to = tickets.length
            ? (page - 1) * PER_PAGE + tickets.length
            : null;

        return {
            data: tickets.map((ticket) => this.ticketResponse(ticket)),
            links: {
                first: url(1),
                last: url(lastPage),
                prev: previousUrl,
                next: nextUrl,
            },
            meta: {
                current_page: page,
                from,
                last_page: lastPage,
                links: [
                    {
                        url: previousUrl,
                        label: 'Previous',
                        page: page > 1 ? page - 1 : null,
                        active: false,
                    },
                    ...pages.map((pageNumber) =>
                        pageNumber === null
                            ? {
                                  url: null,
                                  label: '...',
                                  page: null,
                                  active: false,
                              }
                            : {
                                  url: url(pageNumber),
                                  label: String(pageNumber),
                                  page: pageNumber,
                                  active: pageNumber === page,
                              },
                    ),
                    {
                        url: nextUrl,
                        label: 'Next',
                        page: page < lastPage ? page + 1 : null,
                        active: false,
                    },
                ],
                path: base.toString(),
                per_page: PER_PAGE,
                to,
                total,
            },
        };
    }

    private ticketResponse(ticket: {
        id: bigint;
        title: string;
        description: string;
        status: string;
        priority: string;
        userId: bigint;
        createdAt: Date | null;
        updatedAt: Date | null;
    }) {
        return {
            id: Number(ticket.id),
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            user_id: Number(ticket.userId),
            created_at: serializeDate(ticket.createdAt),
            updated_at: serializeDate(ticket.updatedAt),
        };
    }
}
