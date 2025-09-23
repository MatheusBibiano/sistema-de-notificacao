import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';

export type NotificationStatus =
  | 'AGUARDANDO_PROCESSAMENTO'
  | 'PROCESSADO_SUCESSO'
  | 'FALHA_PROCESSAMENTO';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly statusById = new Map<string, NotificationStatus>();
  private entradaQueue = '';
  private statusQueue = '';

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly configService: ConfigService,
  ) {
    const name = this.configService.get<string>('MEU_NOME');
    this.entradaQueue = `fila.notificacao.entrada.${name || 'USERNAME'}`;
    this.statusQueue = `fila.notificacao.status.${name || 'USERNAME'}`;
  }

  async onModuleInit() {
    await this.rabbit.connect();
    await this.rabbit.assertQueue(this.entradaQueue);
    await this.rabbit.assertQueue(this.statusQueue);
    await this.consumeEntrada();
  }

  async enqueueNotification({
    mensagemId,
    conteudoMensagem,
  }: {
    mensagemId: string;
    conteudoMensagem: string;
  }) {
    this.statusById.set(mensagemId, 'AGUARDANDO_PROCESSAMENTO');
    await this.rabbit.sendToQueue(this.entradaQueue, {
      mensagemId,
      conteudoMensagem,
    });
    return { mensagemId, status: 'AGUARDANDO_PROCESSAMENTO' };
  }

  getStatus(mensagemId: string) {
    const status = this.statusById.get(mensagemId) || null;
    return { mensagemId, status };
  }

  private async consumeEntrada() {
    await this.rabbit.consume(this.entradaQueue, async (msg) => {
      const payload = msg as { mensagemId: string; conteudoMensagem: string };

      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000),
      );

      const ramdomDelay = Math.floor(Math.random() * 10) + 1;
      const status: NotificationStatus =
        ramdomDelay <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

      this.statusById.set(payload.mensagemId, status);

      await this.rabbit.sendToQueue(this.statusQueue, {
        mensagemId: payload.mensagemId,
        status,
      });
    });
  }
}
