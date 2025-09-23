import { TestBed } from '@angular/core/testing';
import { NotificacaoComponent } from './notificacao.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('NotificacaoComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NotificacaoComponent],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('envia POST e adiciona item com status AGUARDANDO_PROCESSAMENTO', () => {
    const fixture = TestBed.createComponent(NotificacaoComponent);
    const comp = fixture.componentInstance;

    comp.input.setValue('mensagem');
    comp.send();

    const req = httpMock.expectOne((request) => /\/api\/notificar$/.test(request.url));
    expect(req.request.method).toBe('POST');
    req.flush({}, { status: 202, statusText: 'Accepted' });

    const list = comp.notificacoes();
    expect(list.length).toBe(1);
    expect(list[0].status).toBe('AGUARDANDO_PROCESSAMENTO');
  });
});
