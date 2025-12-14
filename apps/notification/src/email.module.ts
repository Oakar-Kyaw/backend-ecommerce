import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: '173.194.174.109', // Direct IP to bypass DNS issues with smtp.gmail.com
        port: envConfig().smtp_port || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: envConfig().smtp_user, // your email
          pass: envConfig().smtp_pass, // your app password
        },
        tls: {
          rejectUnauthorized: false,
        },
        family: 4, // Force IPv4
      },
      defaults: {
        from: `"Mega Smart Cart" <${process.env.SMTP_USER}>`,
      },
      //   template: {
      //     dir: join(__dirname, 'templates'),
      //     adapter: new HandlebarsAdapter(),
      //     options: {
      //       strict: true,
      //     },
      //   },
    }),
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
