import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard.js';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';

@Module({
    imports: [JwtModule.register({})],
    controllers: [TicketsController],
    providers: [TicketsService, AuthGuard],
})
export class TicketsModule {}
