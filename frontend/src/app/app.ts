import { Component } from '@angular/core';
import { NotificacaoComponent } from './notificacao/notificacao.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [NotificacaoComponent],
})
export class App {}
