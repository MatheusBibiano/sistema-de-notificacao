import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Get,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificarDto } from './dto/notificar.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('notificar')
  @HttpCode(HttpStatus.ACCEPTED)
  async notificar(@Body() body: NotificarDto) {
    return await this.notificationsService.enqueueNotification(body);
  }

  @Get('notificacao/status/:mensagemId')
  status(@Param('mensagemId') mensagemId: string) {
    return this.notificationsService.getStatus(mensagemId);
  }
}
