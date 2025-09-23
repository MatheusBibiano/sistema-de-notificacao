import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RabbitMqService } from './rabbitmq.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, RabbitMqService],
})
export class NotificationsModule {}
