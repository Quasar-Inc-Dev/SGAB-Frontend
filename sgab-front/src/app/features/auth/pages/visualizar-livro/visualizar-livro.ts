import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LivroService } from '../../../../core/services/livro';
import { Exemplar, ExemplarStatus, Livro } from '../../../../core/models/livro';
import { Solicitacao } from '../../../../core/models/solicitacao';
import { auth } from '../../../../core/auth/auth';
import { SolicitacaoService } from '../../../../core/services/solicitacao';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

interface CampoLivro {
  key: keyof Livro;
  label: string;
  span?: boolean;
  textarea?: boolean;
}

@Component({
  selector: 'app-visualizar-livro',
  imports: [Header, Footer, RouterLink, DatePipe],
  templateUrl: './visualizar-livro.html',
  styleUrl: './visualizar-livro.scss',
})
export class VisualizarLivro implements OnInit {
  private route = inject(ActivatedRoute);
  private livroService = inject(LivroService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private auth = inject(auth);
  private solicitacaoService = inject(SolicitacaoService);

  private readonly livroId = Number(this.route.snapshot.paramMap.get('id'));

  livro = signal<Livro | null>(null);
  carregando = signal(true);
  erro = signal(false);

  exemplares = signal<Exemplar[]>([]);

  isLeitor = this.auth.isLeitor();
  minhasPendentes = signal<Solicitacao[]>([]);
  enviando = signal(false);
  mensagem = signal<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  ativo = computed(() => this.livro()?.livroStatus === 'ATIVO');
  temDisponivel = computed(() => (this.livro()?.exemplaresDisponiveis ?? 0) > 0);
  pendenteEmprestimo = computed(() => this.minhasPendentes().find(s => s.tipo === 'EMPRESTIMO') ?? null);

  readonly statusForaDeCirculacao: ExemplarStatus[] = ['MANUTENCAO', 'EXTRAVIADO'];

  readonly etiquetasExemplar: Record<ExemplarStatus, { label: string; classes: string }> = {
    DISPONIVEL: { label: 'Disponível', classes: 'bg-green-100 text-green-700' },
    EMPRESTADO: { label: 'Emprestado', classes: 'bg-blue-100 text-blue-700' },
    RESERVADO: { label: 'Reservado', classes: 'bg-amber-100 text-amber-700' },
    MANUTENCAO: { label: 'Manutenção', classes: 'bg-gray-100 text-gray-600' },
    EXTRAVIADO: { label: 'Extraviado', classes: 'bg-gray-100 text-gray-500' },
  };

  readonly campos: CampoLivro[] = [
    { key: 'isbn', label: 'ISBN' },
    { key: 'pha', label: 'PHA' },
    { key: 'dewey', label: 'Dewey' },
    { key: 'titulo', label: 'Título', span: true },
    { key: 'subtitulo', label: 'Subtítulo', span: true },
    { key: 'autor', label: 'Autor' },
    { key: 'editora', label: 'Editora' },
    { key: 'genero', label: 'Gênero' },
    { key: 'area', label: 'Área' },
    { key: 'idioma', label: 'Idioma' },
    { key: 'paginas', label: 'Páginas' },
    { key: 'ano', label: 'Ano' },
    { key: 'tags', label: 'Tags', span: true },
    { key: 'livroStatus', label: 'Status' },
    { key: 'descricao', label: 'Descrição', span: true, textarea: true },
  ];

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.carregarLivro();
    this.carregarExemplares();

    if (this.isLeitor) this.carregarMinhasPendentes();
  }

  valor(key: keyof Livro): string {
    const v = this.livro()?.[key];
    if (v === null || v === undefined || v === '') return '-';
    if (key === 'livroStatus') return v === 'ATIVO' ? 'Ativo' : 'Inativo';
    return String(v);
  }

  pendenteReserva(exemplarId: number): Solicitacao | null {
    return this.minhasPendentes().find(s => s.tipo === 'RESERVA' && s.exemplarId === exemplarId) ?? null;
  }

  solicitarEmprestimo(): void {
    this.enviando.set(true);
    this.mensagem.set(null);

    this.solicitacaoService.solicitarEmprestimo(this.livroId).subscribe({
      next: (solicitacao) => {
        this.minhasPendentes.update(lista => [...lista, solicitacao]);
        this.sucesso('Solicitação de empréstimo enviada, aguardando aprovação.');
      },
      error: (err: HttpErrorResponse) => this.falha(err, 'Não foi possível solicitar o empréstimo.'),
    });
  }

  solicitarReserva(exemplar: Exemplar): void {
    this.enviando.set(true);
    this.mensagem.set(null);

    this.solicitacaoService.solicitarReserva(exemplar.exemplarId).subscribe({
      next: (solicitacao) => {
        this.minhasPendentes.update(lista => [...lista, solicitacao]);
        this.sucesso(`Solicitação de reserva do exemplar ${exemplar.tombo} enviada, aguardando aprovação.`);
      },
      error: (err: HttpErrorResponse) => this.falha(err, 'Não foi possível solicitar a reserva.'),
    });
  }

  cancelarSolicitacao(solicitacao: Solicitacao): void {
    this.enviando.set(true);
    this.mensagem.set(null);

    this.solicitacaoService.cancelar(solicitacao.solicitacaoId).subscribe({
      next: () => {
        this.minhasPendentes.update(lista => lista.filter(s => s.solicitacaoId !== solicitacao.solicitacaoId));
        this.sucesso('Solicitação cancelada.');
      },
      error: (err: HttpErrorResponse) => this.falha(err, 'Não foi possível cancelar a solicitação.'),
    });
  }

  private carregarLivro(): void {
    this.livroService.buscarPorId(this.livroId).subscribe({
      next: (livro) => {
        this.livro.set(livro);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  private carregarExemplares(): void {
    this.livroService.listarExemplares(this.livroId).subscribe({
      next: (exemplares) => this.exemplares.set(exemplares),
    });
  }

  private carregarMinhasPendentes(): void {
    this.solicitacaoService.minhas().subscribe({
      next: (lista) => this.minhasPendentes.set(
        lista.filter(s => s.livroId === this.livroId && (s.status === 'PENDENTE' || s.status === 'AGUARDANDO_RETIRADA'))
      ),
    });
  }

  private sucesso(texto: string): void {
    this.mensagem.set({ tipo: 'sucesso', texto });
    this.enviando.set(false);
  }

  private falha(err: HttpErrorResponse, padrao: string): void {
    this.mensagem.set({ tipo: 'erro', texto: mensagemErro(err, padrao) });
    this.enviando.set(false);
  }
}
