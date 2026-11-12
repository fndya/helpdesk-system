import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TicketsModule } from './tickets/tickets.module.js';

@Module({
    imports: [PrismaModule, AuthModule, TicketsModule],
})
export class AppModule {}
