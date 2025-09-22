import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from './dto/create-notification.dto';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(emailData: SendEmailDto) {
    const { to, subject, text, html, template, context } = emailData;
    console.log("emailData",emailData);
    await this.mailerService.sendMail({
        to,
        subject,
        text,
        html,
        template,
        context,
      })
    return { success: true, message: 'Email sent successfully'};
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: {
        name,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        resetUrl,
        expirationTime: '1 hour',
      },
    });
  }

  async sendNotificationEmail(to: string, title: string, message: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });
  }

  async sendBulkEmails(recipients: string[], subject: string, content: string): Promise<void> {
    const emailPromises = recipients.map(recipient =>
      this.sendEmail({
        to: recipient,
        subject,
        html: content,
      })
    );

    try {
      await Promise.all(emailPromises);
      console.log(`Bulk emails sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw new Error('Failed to send bulk emails');
    }
  }
}
