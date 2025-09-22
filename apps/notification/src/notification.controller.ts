import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  NotificationDto,
  SaveNotificationTokenDto,
} from './dto/create-notification.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('api/v1')
export class NotificationController {
  constructor(
    private readonly pushNotificationService: NotificationService,
  ) {}
  @ApiOperation({ summary: 'Send a push notification to a single device' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @Post("send-notification")
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
