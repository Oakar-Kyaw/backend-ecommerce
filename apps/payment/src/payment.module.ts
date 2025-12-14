import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { envConfig, GlobalConfigModule } from 'libs/config/envConfig';

@Module({
  imports: [
    GlobalConfigModule,
    MongooseModule.forRoot(envConfig().payment_service_db),
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
