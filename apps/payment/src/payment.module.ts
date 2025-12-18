import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { envConfig, GlobalConfigModule } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { EventPublisherService } from './event-publisher.service';
import { PaymentWorker } from './payment.worker';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    GlobalConfigModule,
    MongooseModule.forRoot(envConfig().payment_service_db),
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema }  
    ]),
    PublishMessageModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: envConfig().notification_service_tcp,
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, EventPublisherService, PaymentWorker],
})
export class PaymentModule {}
