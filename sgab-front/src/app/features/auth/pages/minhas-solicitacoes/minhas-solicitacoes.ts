import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { SolicitacaoService } from '../../../../core/services/solicitacao';
import { EmprestimoService } from '../../../../core/services/emprestimo';
import { Solicitacao, SolicitacaoStatus, SolicitacaoTipo } from '../../../../core/models/solicitacao';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

interface Etiqueta {
  label: string;
  classes: string;
}

@Component({
  selector: 'app-minhas-solicitacoes',
  imports: [Header, Footer, DatePipe, RouterLink],
  templateUrl: './minhas-solicitacoes.html',
  styleUrl: './minhas-solicitacoes.scss',
})
export class MinhasSolicitacoes implements OnInit {
  private solicitacaoService = inject(SolicitacaoService);
  private emprestimoService = inject(EmprestimoService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  solicitacoes = signal<Solicitacao[]>([]);
  carregando = signal(true);
  erro = signal(false);

  filtroTipo = signal<SolicitacaoTipo | ''>('');
  filtroStatus = signal<SolicitacaoStatus | ''>('');

  cancelandoId = signal<number | null>(null);
  erroCancelamento = signal<Record<number, string>>({});

  readonly etiquetasTipo: Record<SolicitacaoTipo, Etiqueta> = {
    EMPRESTIMO: { label: 'Empréstimo', classes: 'bg-blue-100 text-blue-700' },
    RESERVA: { label: 'Reserva', classes: 'bg-amber-100 text-amber-700' },
  };

  readonly etiquetasStatus: Record<SolicitacaoStatus, Etiqueta> = {
    PENDENTE: { label: 'Aguardando aprovação', classes: 'bg-amber-100 text-amber-700' },
    AGUARDANDO_RETIRADA: { label: 'Retirar no balcão', classes: 'bg-green-100 text-green-700' },
    APROVADA: { label: 'Aprovada', classes: 'bg-blue-100 text-blue-700' },
    RECUSADA: { label: 'Recusada', classes: 'bg-red-100 text-red-700' },
    CANCELADA: { label: 'Cancelada', classes: 'bg-gray-100 text-gray-500' },
    EXPIRADA: { label: 'Expirada', classes: 'bg-gray-100 text-gray-500' },
  };

  // emprestimoId -> dataDevolucaoPrevista, para os empréstimos já retirados
  devolucoes = signal<Record<number, string>>({});

  readonly tipos = Object.keys(this.etiquetasTipo) as SolicitacaoTipo[];
  readonly status = Object.keys(this.etiquetasStatus) as SolicitacaoStatus[];

  contagemStatus = computed(() =>
    this.solicitacoes()
      .filter(s => !this.filtroTipo() || s.tipo === this.filtroTipo())
      .reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {} as Record<string, number>)
  );

  solicitacoesFiltradas = computed(() => {
    const tipo = this.filtroTipo();
    const status = this.filtroStatus();
    return this.solicitacoes().filter(s => (!tipo || s.tipo === tipo) && (!status || s.status === status));
  });

  totalDoTipo = computed(() => this.solicitacoes().filter(s => !this.filtroTipo() || s.tipo === this.filtroTipo()).length);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.solicitacaoService.minhas().subscribe({
      next: (lista) => {
        this.solicitacoes.set(lista);
        this.carregando.set(false);
        this.carregarDevolucoes(lista);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  podeCancelar(s: Solicitacao): boolean {
    return s.status === 'PENDENTE' || s.status === 'AGUARDANDO_RETIRADA';
  }

  private carregarDevolucoes(lista: Solicitacao[]): void {
    lista
      .filter(s => s.tipo === 'EMPRESTIMO' && s.status === 'APROVADA' && s.emprestimoId)
      .forEach(s => {
        this.emprestimoService.buscarPorId(s.emprestimoId!).subscribe({
          next: (e) => this.devolucoes.update(d => ({ ...d, [e.emprestimoId]: e.dataDevolucaoPrevista })),
        });
      });
  }

  cancelar(s: Solicitacao) {
    this.cancelandoId.set(s.solicitacaoId);
    this.erroCancelamento.update(({ [s.solicitacaoId]: _, ...resto }) => resto);

    this.solicitacaoService.cancelar(s.solicitacaoId).subscribe({
      next: (atualizada) => {
        this.solicitacoes.update(lista => lista.map(item => (item.solicitacaoId === s.solicitacaoId ? atualizada : item)));
        this.cancelandoId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.erroCancelamento.update(erros => ({ ...erros, [s.solicitacaoId]: mensagemErro(err, 'Não foi possível cancelar a solicitação.') }));
        this.cancelandoId.set(null);
      },
    });
  }
}
