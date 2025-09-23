import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { RabbitMqService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const rabbitMock: jest.Mocked<RabbitMqService> = {
    connect: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    sendToQueue: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockImplementation(async (_q: string, _cb: (payload: unknown) => Promise<void>) => {
      (rabbitMock as any)._cb = _cb;
    }),
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: RabbitMqService, useValue: rabbitMock },
        { provide: ConfigService, useValue: { get: () => 'testuser' } },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  it('should publish to entrada queue on enqueue', async () => {
    const mensagemId = '123';
    const conteudoMensagem = 'hello';
    await service.enqueueNotification({ mensagemId, conteudoMensagem });
    expect(rabbitMock.sendToQueue).toHaveBeenCalled();
    const [queue, payload] = rabbitMock.sendToQueue.mock.calls[0];
    expect(queue).toContain('fila.notificacao.entrada');
    expect(payload).toEqual({ mensagemId, conteudoMensagem });
  });

  // Validation is handled by DTO/ValidationPipe in controller; service assumes valid input

  it('getStatus should return null when not found', async () => {
    const res = await service.getStatus('nao-existe');
    expect(res).toEqual({ mensagemId: 'nao-existe', status: null });
  });

  it('onModuleInit wires queues and processes a message (success path)', async () => {
    jest.useFakeTimers();
    const originalRandom = Math.random;
    Math.random = () => 0.5; // > 0.2 => success path

    await service.onModuleInit();
    expect(rabbitMock.connect).toHaveBeenCalled();
    expect(rabbitMock.assertQueue).toHaveBeenCalledTimes(2);
    expect(rabbitMock.consume).toHaveBeenCalledTimes(1);

    const mensagemId = 'mid-1';
    const conteudoMensagem = 'process me';
    const p = (rabbitMock as any)._cb({ mensagemId, conteudoMensagem });
    jest.advanceTimersByTime(1500);
    await p;

    const st = await service.getStatus(mensagemId);
    expect(st.status).toBe('PROCESSADO_SUCESSO');
    expect(rabbitMock.sendToQueue).toHaveBeenCalled();

    Math.random = originalRandom;
    jest.useRealTimers();
  });

  it('processes a message (failure path)', async () => {
    jest.useFakeTimers();
    const originalRandom = Math.random;
    Math.random = () => 0.0; // <= 0.2 => failure path (1)

    await service.onModuleInit();
    const mensagemId = 'mid-2';
    const conteudoMensagem = 'process me too';
    const p = (rabbitMock as any)._cb({ mensagemId, conteudoMensagem });
    jest.advanceTimersByTime(1500);
    await p;

    const st = await service.getStatus(mensagemId);
    expect(st.status).toBe('FALHA_PROCESSAMENTO');

    Math.random = originalRandom;
    jest.useRealTimers();
  });
});
