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
  emprestimoParaDevolver = signal<Emprestimo | null>(null);
  devolvendoId = signal<number | null>(null);
  emprestimoDevolvidoId = signal<number | null>(null);
  erroDevolucao = signal('');

  reservas = signal<Reserva[]>([]);
  carregandoReservas = signal(true);
  erroReservas = signal(false);
  filtroReserva = signal<ReservaStatus | ''>('');
  renovandoReservaId = signal<number | null>(null);
  reservaRenovadaId = signal<number | null>(null);
  // Separado dos erros de solicitação: reservaId e solicitacaoId podem ter o mesmo número
  errosReserva = signal<Record<number, string>>({});

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

    // Pendentes e aguardando retirada carregam já: são o trabalho do dia.
    // Empréstimos e reservas (histórico, listas maiores) só carregam quando a aba é aberta;
    // até lá, os contadores das abas vêm de uma consulta leve que só pega o total.
    this.carregarPendentes();
    this.carregarAguardandoRetirada();
    this.atualizarTotais();
  }

  trocarAba(aba: Aba) {
    this.aba.set(aba);
    this.busca.set('');

    if (aba === 'emprestimos' && !this.emprestimosCarregados) this.carregarEmprestimos();
    if (aba === 'reservas' && !this.reservasCarregadas) this.carregarReservas();
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
        if (this.emprestimosCarregados) this.carregarEmprestimos();
        else this.atualizarTotais();
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

  // ---------- Devolução de empréstimo ----------

  pedirDevolucao(e: Emprestimo) {
    this.erroDevolucao.set('');
    this.emprestimoParaDevolver.set(e);
  }

  cancelarDevolucao() {
    if (this.devolvendoId() !== null) return;
    this.emprestimoParaDevolver.set(null);
  }

  confirmarDevolucao() {
    const e = this.emprestimoParaDevolver();
    if (!e) return;

    this.devolvendoId.set(e.emprestimoId);
    this.erroDevolucao.set('');

    this.emprestimoService.devolver(e.emprestimoId).subscribe({
      next: (atualizado) => {
        this.emprestimos.update(lista => lista.map(item => (item.emprestimoId === atualizado.emprestimoId ? atualizado : item)));
        this.devolvendoId.set(null);
        this.emprestimoParaDevolver.set(null);
        this.emprestimoDevolvidoId.set(atualizado.emprestimoId);
        // O exemplar pode ter ido para o primeiro da fila: a reserva dele vira "aguardando retirada"
        if (this.reservasCarregadas) this.carregarReservas();
      },
      error: (err: HttpErrorResponse) => {
        this.devolvendoId.set(null);
        this.erroDevolucao.set(mensagemErro(err, 'Não foi possível registrar a devolução.'));
      },
    });
  }

  renovarReserva(r: Reserva) {
    this.renovandoReservaId.set(r.reservaId);
    this.reservaRenovadaId.set(null);
    this.errosReserva.update(({ [r.reservaId]: _, ...resto }) => resto);

    this.reservaService.renovar(r.reservaId).subscribe({
      next: (atualizada) => {
        this.reservas.update(lista => lista.map(item => (item.reservaId === atualizada.reservaId ? atualizada : item)));
        this.renovandoReservaId.set(null);
        this.reservaRenovadaId.set(atualizada.reservaId);
      },
      error: (err: HttpErrorResponse) => {
        this.errosReserva.update(erros => ({ ...erros, [r.reservaId]: mensagemErro(err, 'Não foi possível renovar a reserva.') }));
        this.renovandoReservaId.set(null);
      },
    });
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

  private emprestimosCarregados = false;
  private reservasCarregadas = false;

  // Contadores das abas de histórico (null = ainda não chegou)
  totalEmprestimos = signal<number | null>(null);
  totalReservas = signal<number | null>(null);

  // Pede uma página de 1 item só para ler page.totalElements, sem baixar as listas.
  // Só para as abas que ainda não foram abertas (as abertas já sabem o total pela lista).
  private atualizarTotais(): void {
    if (!this.emprestimosCarregados) {
      this.emprestimoService.listarPagina({ page: 0, size: 1 }).subscribe({
        next: (pagina) => this.totalEmprestimos.set(pagina.page.totalElements),
      });
    }
    if (!this.reservasCarregadas) {
      this.reservaService.listarPagina({ page: 0, size: 1 }).subscribe({
        next: (pagina) => this.totalReservas.set(pagina.page.totalElements),
      });
    }
  }

  private carregarEmprestimos(): void {
    this.emprestimosCarregados = true;
    this.carregandoEmprestimos.set(true);
    this.erroEmprestimos.set(false);
    this.emprestimoService.listar().subscribe({
      next: (lista) => {
        this.emprestimos.set([...lista].sort((a, b) => b.emprestimoId - a.emprestimoId));
        this.totalEmprestimos.set(lista.length);
        this.carregandoEmprestimos.set(false);
      },
      error: () => {
        this.erroEmprestimos.set(true);
        this.carregandoEmprestimos.set(false);
      },
    });
  }

  private carregarReservas(): void {
    this.reservasCarregadas = true;
    this.carregandoReservas.set(true);
    this.erroReservas.set(false);
    this.reservaService.listar().subscribe({
      next: (lista) => {
        this.reservas.set([...lista].sort((a, b) => b.reservaId - a.reservaId));
        this.totalReservas.set(lista.length);
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
    // Abas já abertas recarregam a lista; as outras só atualizam o contador
    if (this.emprestimosCarregados) this.carregarEmprestimos();
    if (this.reservasCarregadas) this.carregarReservas();
    this.atualizarTotais();
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
