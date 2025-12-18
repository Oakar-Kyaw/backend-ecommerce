import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  NotificationDto,
  SaveNotificationTokenDto,
} from './dto/create-notification.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('api/v1')
export class NotificationController {
  constructor(private readonly pushNotificationService: NotificationService) {}
  
  @EventPattern('notify_order')
  async handleOrderNotification(@Payload() data: any) {
    console.log('Received notify_order event', data);
    await this.pushNotificationService.sendOrderNotification(data);
  }

  @EventPattern('notify_brand_order')
  async handleBrandOrderNotification(@Payload() data: any) {
    console.log('Received notify_brand_order event', data);
    await this.pushNotificationService.sendBrandOrderNotification(data);
  }

  @EventPattern('notify_payment')
  async handlePaymentNotification(@Payload() data: any) {
    console.log('Received notify_payment event', data);
    await this.pushNotificationService.sendPaymentNotification(data);
  }

  @ApiOperation({ summary: 'Send a push notification to a single device' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @Post('send-notification')
  async sendNotification(@Body() body: NotificationDto) {
    return this.pushNotificationService.sendNotification(body);
  }

  @Post('send-multiple-notifications')
  @ApiOperation({ summary: 'Send push notifications to multiple devices' })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  async sendMultipleNotifications(@Body() body: NotificationDto) {
    return this.pushNotificationService.sendNotificationToMultipleTokens(body);
  }

  @Post('token/create')
  @ApiOperation({ summary: 'Save a push notification token.' })
  @ApiResponse({
    status: 200,
    description: 'Topic notification sent successfully',
  })
  async saveNotificationToken(@Body() body: SaveNotificationTokenDto) {
    return this.pushNotificationService.saveNotificationToken(body);
  }
}
