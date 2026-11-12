import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is required');
        const schema =
            new URL(connectionString).searchParams.get('schema') ?? 'public';
        super({ adapter: new PrismaPg(connectionString, { schema }) });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
