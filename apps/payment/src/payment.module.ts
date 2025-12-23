import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { envConfig, GlobalConfigModule } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { User, UserSchema } from './schemas/user.schema';
import { PaymentUserWorker } from './payment.worker';

@Module({
  imports: [
    GlobalConfigModule,
    MongooseModule.forRoot(envConfig().payment_service_db),
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    // ClientsModule.register([
    //   {
    //     name: 'NOTIFICATION_SERVICE',
    //     transport: Transport.TCP,
    //     options: {
    //       host: '0.0.0.0',
    //       port: envConfig().notification_service_tcp,
    //     },
    //   },
    // ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService,  
    PaymentUserWorker
  ],
})
export class PaymentModule {}
