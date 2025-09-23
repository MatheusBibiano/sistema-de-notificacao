import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const serviceMock = {
    enqueueNotification: jest.fn().mockResolvedValue({
      mensagemId: 'id',
      status: 'AGUARDANDO_PROCESSAMENTO',
    }),
    getStatus: jest.fn().mockResolvedValue({
      mensagemId: 'id',
      status: 'AGUARDANDO_PROCESSAMENTO',
    }),
  } as Partial<NotificationsService> as NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(NotificationsController);
    service = moduleRef.get(NotificationsService);
  });

  it('should accept notificar and return accepted payload', async () => {
    const dto = {
      mensagemId: 'a9a1a0d2-7a61-4b94-9cc2-3d2f9f9a9999',
      conteudoMensagem: 'hi',
    } as any;
    const res = await controller.notificar(dto);
    expect(service.enqueueNotification).toHaveBeenCalledWith(dto);
    expect(res).toEqual({
      mensagemId: 'id',
      status: 'AGUARDANDO_PROCESSAMENTO',
    });
  });

  it('should return status by id', async () => {
    const res = await controller.status('id');
    expect(service.getStatus).toHaveBeenCalledWith('id');
    expect(res).toEqual({
      mensagemId: 'id',
      status: 'AGUARDANDO_PROCESSAMENTO',
    });
  });
});
