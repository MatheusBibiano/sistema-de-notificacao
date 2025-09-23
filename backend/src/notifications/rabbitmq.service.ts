import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly logger = new Logger(RabbitMqService.name);

  constructor(private readonly configService: ConfigService) {}

  async connect() {
    if (this.connection && this.channel) return;
    const url =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@localhost:5672';

    const maxAttempts = 10;
    const baseDelayMs = 500;
    let attempt = 0;

    while (true) {
      try {
        this.logger.log(`Connecting to RabbitMQ at ${url} (attempt ${attempt + 1}/${maxAttempts})`);
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        this.logger.log('RabbitMQ connection established');
        break;
      } catch (error) {
        attempt += 1;
        const isLastAttempt = attempt >= maxAttempts;
        this.logger.error(
          `RabbitMQ connection failed: ${(error as Error).message}.` +
            (isLastAttempt ? ' No more retries left.' : ' Retrying...'),
        );
        if (isLastAttempt) throw error;
        const delayMs = Math.min(10000, baseDelayMs * 2 ** (attempt - 1));
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async assertQueue(queue: string) {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.assertQueue(queue, { durable: true });
  }

  async sendToQueue(queue: string, payload: unknown) {
    if (!this.channel) throw new Error('Channel not initialized');
    const buffer = Buffer.from(JSON.stringify(payload));
    this.channel.sendToQueue(queue, buffer, {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async consume(queue: string, onMessage: (payload: unknown) => Promise<void>) {
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await onMessage(content);
        this.channel!.ack(msg);
      } catch (err) {
        this.logger.error('Error processing message', err as Error);
        this.channel!.nack(msg, false, false);
      }
    });
  }
}
