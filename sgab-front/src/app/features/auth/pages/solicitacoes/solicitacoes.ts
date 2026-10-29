import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser, LowerCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { EmprestimoService } from '../../../../core/services/emprestimo';
import { ReservaService } from '../../../../core/services/reserva';
import { SolicitacaoService } from '../../../../core/services/solicitacao';
import { Emprestimo } from '../../../../core/models/emprestimo';
import { Reserva, ReservaStatus } from '../../../../core/models/reserva';
import { Solicitacao, SolicitacaoTipo } from '../../../../core/models/solicitacao';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

type Aba = 'pendentes' | 'retirada' | 'emprestimos' | 'reservas';
type SituacaoEmprestimo = 'EM_ANDAMENTO' | 'ATRASADO' | 'DEVOLVIDO';

interface Etiqueta {
  label: string;
  classes: string;
}

@Component({
  selector: 'app-solicitacoes',
  imports: [Header, Footer, DatePipe, LowerCasePipe],
  templateUrl: './solicitacoes.html',
  styleUrl: './solicitacoes.scss',
})
export class Solicitacoes implements OnInit {
  private emprestimoService = inject(EmprestimoService);
  private reservaService = inject(ReservaService);
  private solicitacaoService = inject(SolicitacaoService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  aba = signal<Aba>('pendentes');
  busca = signal('');

  pendentes = signal<Solicitacao[]>([]);
  carregandoPendentes = signal(true);
  erroPendentes = signal(false);
  filtroTipo = signal<SolicitacaoTipo | ''>('');
  processandoId = signal<number | null>(null);
  errosPendentes = signal<Record<number, string>>({});
  solicitacaoRecusando = signal<Solicitacao | null>(null);
  motivoRecusa = signal('');

  aguardandoRetirada = signal<Solicitacao[]>([]);
  carregandoRetirada = signal(true);
  erroRetirada = signal(false);

  emprestimos = signal<Emprestimo[]>([]);
  carregandoEmprestimos = signal(true);
  erroEmprestimos = signal(false);
  filtroEmprestimo = signal<SituacaoEmprestimo | ''>('');

  reservas = signal<Reserva[]>([]);
  carregandoReservas = signal(true);
  erroReservas = signal(false);
  filtroReserva = signal<ReservaStatus | ''>('');

  readonly etiquetasTipo: Record<SolicitacaoTipo, Etiqueta> = {
    EMPRESTIMO: { label: 'Empréstimo', classes: 'bg-blue-100 text-blue-700' },
    RESERVA: { label: 'Reserva', classes: 'bg-amber-100 text-amber-700' },
  };

  readonly etiquetasEmprestimo: Record<SituacaoEmprestimo, Etiqueta> = {
    EM_ANDAMENTO: { label: 'Em andamento', classes: 'bg-blue-100 text-blue-700' },
    ATRASADO: { label: 'Atrasado', classes: 'bg-red-100 text-red-700' },
    DEVOLVIDO: { label: 'Devolvido', classes: 'bg-gray-100 text-gray-700' },
  };

  readonly etiquetasReserva: Record<ReservaStatus, Etiqueta> = {
    ATIVA: { label: 'Na fila', classes: 'bg-amber-100 text-amber-700' },
    AGUARDANDO_RETIRADA: { label: 'Aguardando retirada', classes: 'bg-green-100 text-green-700' },
    ATENDIDA: { label: 'Atendida', classes: 'bg-gray-100 text-gray-700' },
    CANCELADA: { label: 'Cancelada', classes: 'bg-gray-100 text-gray-500' },
  };

  readonly tiposSolicitacao = Object.keys(this.etiquetasTipo) as SolicitacaoTipo[];
  readonly situacoesEmprestimo = Object.keys(this.etiquetasEmprestimo) as SituacaoEmprestimo[];
  readonly statusReserva = Object.keys(this.etiquetasReserva) as ReservaStatus[];

  contagemPendentes = computed(() => this.contar(this.pendentes().map(s => s.tipo)));
  contagemEmprestimos = computed(() => this.contar(this.emprestimos().map(e => this.situacao(e))));
  contagemReservas = computed(() => this.contar(this.reservas().map(r => r.status)));

  pendentesFiltradas = computed(() => {
    const filtro = this.filtroTipo();
    return this.pendentes()
      .filter(s => !filtro || s.tipo === filtro)
      .filter(s => this.bateBusca(s.titulo, s.nomeLeitor));
  });

  aguardandoFiltradas = computed(() =>
    this.aguardandoRetirada().filter(s => this.bateBusca(s.titulo, s.nomeLeitor))
  );

  emprestimosFiltrados = computed(() => {
    const filtro = this.filtroEmprestimo();
    return this.emprestimos()
      .filter(e => !filtro || this.situacao(e) === filtro)
      .filter(e => this.bateBusca(e.titulo, e.nomeLeitor));
  });

  reservasFiltradas = computed(() => {
    const filtro = this.filtroReserva();
    return this.reservas()
      .filter(r => !filtro || r.status === filtro)
      .filter(r => this.bateBusca(r.titulo, r.nomeLeitor));
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.carregarPendentes();
    this.carregarAguardandoRetirada();
    this.carregarEmprestimos();
    this.carregarReservas();
  }

  trocarAba(aba: Aba) {
    this.aba.set(aba);
    this.busca.set('');
  }

  onBuscaChange(event: Event) {
    this.busca.set((event.target as HTMLInputElement).value);
  }

  aprovar(s: Solicitacao) {
    this.processandoId.set(s.solicitacaoId);
    this.limparErro(s.solicitacaoId);

    this.solicitacaoService.aprovar(s.solicitacaoId).subscribe({
      next: () => this.concluirAnalise(s),
      error: (err: HttpErrorResponse) => this.erroAnalise(s, err, 'Não foi possível aprovar a solicitação.'),
    });
  }

  confirmarRetirada(s: Solicitacao) {
    this.processandoId.set(s.solicitacaoId);
    this.limparErro(s.solicitacaoId);

    this.solicitacaoService.confirmarRetirada(s.solicitacaoId).subscribe({
      next: () => {
        this.aguardandoRetirada.update(lista => lista.filter(a => a.solicitacaoId !== s.solicitacaoId));
        this.processandoId.set(null);
        this.carregarEmprestimos();
      },
      error: (err: HttpErrorResponse) => {
        this.erroAnalise(s, err, 'Não foi possível confirmar a retirada.');
        // 409 (ex.: prazo expirado ou status mudou): recarrega para refletir o estado real
        if (err.status === 409) this.carregarAguardandoRetirada();
      },
    });
  }

  prazoRetiradaVencido(s: Solicitacao): boolean {
    return !!s.dataLimiteRetirada && new Date(s.dataLimiteRetirada) < new Date();
  }

  abrirRecusa(s: Solicitacao) {
    this.motivoRecusa.set('');
    this.solicitacaoRecusando.set(s);
  }

  fecharRecusa() {
    if (this.processandoId() !== null) return;
    this.solicitacaoRecusando.set(null);
  }

  onMotivoChange(event: Event) {
    this.motivoRecusa.set((event.target as HTMLTextAreaElement).value);
  }

  confirmarRecusa() {
    const s = this.solicitacaoRecusando();
    if (!s) return;

    this.processandoId.set(s.solicitacaoId);
    this.limparErro(s.solicitacaoId);

    this.solicitacaoService.recusar(s.solicitacaoId, this.motivoRecusa().trim() || undefined).subscribe({
      next: () => {
        this.solicitacaoRecusando.set(null);
        this.concluirAnalise(s);
      },
      error: (err: HttpErrorResponse) => {
        this.solicitacaoRecusando.set(null);
        this.erroAnalise(s, err, 'Não foi possível recusar a solicitação.');
      },
    });
  }

  situacao(e: Emprestimo): SituacaoEmprestimo {
    if (e.statusDevolucao || e.dataDevolucao) return 'DEVOLVIDO';
    return new Date(e.dataDevolucaoPrevista) < new Date() ? 'ATRASADO' : 'EM_ANDAMENTO';
  }

  diasAtraso(e: Emprestimo): number {
    const ms = Date.now() - new Date(e.dataDevolucaoPrevista).getTime();
    return Math.max(1, Math.floor(ms / 86_400_000));
  }

  retiradaVencida(r: Reserva): boolean {
    return r.status === 'AGUARDANDO_RETIRADA' && !!r.dataLimiteRetirada && new Date(r.dataLimiteRetirada) < new Date();
  }

  private carregarPendentes(): void {
    this.solicitacaoService.listar().subscribe({
      next: (lista) => {
        this.pendentes.set(lista);
        this.carregandoPendentes.set(false);
      },
      error: () => {
        this.erroPendentes.set(true);
        this.carregandoPendentes.set(false);
      },
    });
  }

  private carregarAguardandoRetirada(): void {
    this.solicitacaoService.listar({ status: 'AGUARDANDO_RETIRADA' }).subscribe({
      next: (lista) => {
        this.aguardandoRetirada.set(lista);
        this.carregandoRetirada.set(false);
      },
      error: () => {
        this.erroRetirada.set(true);
        this.carregandoRetirada.set(false);
      },
    });
  }

  private carregarEmprestimos(): void {
    this.emprestimoService.listar().subscribe({
      next: (lista) => {
        this.emprestimos.set([...lista].sort((a, b) => b.emprestimoId - a.emprestimoId));
        this.carregandoEmprestimos.set(false);
      },
      error: () => {
        this.erroEmprestimos.set(true);
        this.carregandoEmprestimos.set(false);
      },
    });
  }

  private carregarReservas(): void {
    this.reservaService.listar().subscribe({
      next: (lista) => {
        this.reservas.set([...lista].sort((a, b) => b.reservaId - a.reservaId));
        this.carregandoReservas.set(false);
      },
      error: () => {
        this.erroReservas.set(true);
        this.carregandoReservas.set(false);
      },
    });
  }

  // Aprovada ou recusada: sai da lista de pendentes e atualiza as outras abas
  private concluirAnalise(s: Solicitacao): void {
    this.pendentes.update(lista => lista.filter(p => p.solicitacaoId !== s.solicitacaoId));
    this.processandoId.set(null);
    this.carregarAguardandoRetirada();
    this.carregarEmprestimos();
    this.carregarReservas();
  }

  // Em caso de erro (ex.: 409), a solicitação continua pendente e o erro aparece na linha
  private erroAnalise(s: Solicitacao, err: HttpErrorResponse, padrao: string): void {
    this.errosPendentes.update(erros => ({ ...erros, [s.solicitacaoId]: mensagemErro(err, padrao) }));
    this.processandoId.set(null);
  }

  private limparErro(id: number): void {
    this.errosPendentes.update(({ [id]: _, ...resto }) => resto);
  }

  private bateBusca(titulo: string, leitor: string): boolean {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return true;
    return (titulo ?? '').toLowerCase().includes(termo) || (leitor ?? '').toLowerCase().includes(termo);
  }

  private contar<T extends string>(valores: T[]): Record<string, number> {
    return valores.reduce((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {} as Record<string, number>);
  }
}
