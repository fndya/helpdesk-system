import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedUser } from '../auth/current-user.js';
import { CreateTicketDto, ListTicketsDto } from './ticket.dto.js';
import { TicketsService } from './tickets.service.js';

interface AuthRequest extends Request {
    user: AuthenticatedUser;
}

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
    constructor(private readonly tickets: TicketsService) {}

    @Post()
    create(@Req() request: AuthRequest, @Body() body: CreateTicketDto) {
        return this.tickets.create(request.user, body);
    }

    @Get()
    list(@Req() request: AuthRequest, @Query() filters: ListTicketsDto) {
        return this.tickets.list(request.user, filters, request);
    }
}
