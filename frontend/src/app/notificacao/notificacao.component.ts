import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';

type Notificacao = { mensagemId: string; conteudoMensagem: string; status: string | null };

@Component({
  selector: 'app-notificacao',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notificacao.component.html',
  styleUrl: './notificacao.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacaoComponent {
  private http = inject(HttpClient);
  private apiUrl = (window as any)['NG_APP_API_URL'] || 'http://localhost:3000/api';

  input = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  notificacoes = signal<Notificacao[]>([]);

  constructor() {
    this.polling();
  }

  private polling(): void {
    setInterval(() => {
      const pendentes = this.notificacoes().filter((n) => n.status === 'AGUARDANDO_PROCESSAMENTO');
      for (const p of pendentes) {
        this.http
          .get<{ mensagemId: string; status: string | null }>(
            `${this.apiUrl}/notificacao/status/${p.mensagemId}`
          )
          .subscribe((resp) => {
            if (resp.status && resp.status !== p.status) {
              this.notificacoes.update((curr) =>
                curr.map((n) => (n.mensagemId === p.mensagemId ? { ...n, status: resp.status } : n))
              );
            }
          });
      }
    }, 4000);
  }

  send(): void {
    if (this.input.invalid) return;
    const mensagemId = uuidv4();
    const conteudoMensagem = this.input.value.trim();
    const nova: Notificacao = { mensagemId, conteudoMensagem, status: 'AGUARDANDO_PROCESSAMENTO' };
    this.notificacoes.update((curr) => [nova, ...curr]);
    this.http
      .post(`${this.apiUrl}/notificar`, { mensagemId, conteudoMensagem }, { observe: 'response' })
      .subscribe({
        next: () => {
          // ok
        },
        error: () => {
          this.notificacoes.update((curr) =>
            curr.map((n) => (n.mensagemId === mensagemId ? { ...n, status: 'ERRO_ENVIO' } : n))
          );
        },
      });
  }
}
