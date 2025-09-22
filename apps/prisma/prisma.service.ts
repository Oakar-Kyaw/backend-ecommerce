import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient as PrismaNotification} from '@prisma/notification';
import { PrismaClient as PrismaUser} from '@prisma/user';

@Injectable()
export class NotificationPrismaService extends PrismaNotification implements OnModuleInit{
    async onModuleInit() {
    try {
        await this.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
    }
}

@Injectable()
export class UserPrismaService extends PrismaUser implements OnModuleInit{
    async onModuleInit() {
        try {
            await this.$connect();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
        }
    }
}
