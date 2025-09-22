import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/create-notification.dto';

class SendEmailRequestDto {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: any;
}

class SendWelcomeEmailDto {
  to: string;
  name: string;
}

class SendNotificationEmailDto {
  to: string;
  title: string;
  message: string;
}

class SendBulkEmailDto {
  recipients: string[];
  subject: string;
  content: string;
}

@Controller('api/v1/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() emailData: SendEmailDto) {
    return this.emailService.sendEmail(emailData);
  }

  @Post('welcome')
  async sendWelcomeEmail(@Body() { to, name }: SendWelcomeEmailDto) {
    return await this.emailService.sendWelcomeEmail(to, name)
  }

  @Post('notification')
  async sendNotificationEmail(@Body() { to, title, message }: SendNotificationEmailDto) {
    return this.emailService.sendNotificationEmail(to, title, message);
  }

  @Post('bulk')
  async sendBulkEmails(@Body() { recipients, subject, content }: SendBulkEmailDto) {
    return await this.emailService.sendBulkEmails(recipients, subject, content);
  }
}