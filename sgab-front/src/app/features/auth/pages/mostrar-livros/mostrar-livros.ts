import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LivroService } from '../../../../core/services/livro';
import { Livro } from '../../../../core/models/livro';
import { EditarLivroModal } from '../../../../shared/editar-livro-modal/editar-livro-modal';

@Component({
  selector: 'app-mostrar-livros',
  imports: [Header, Footer, EditarLivroModal],
  templateUrl: './mostrar-livros.html',
  styleUrl: './mostrar-livros.scss',
})
export class MostrarLivros implements OnInit {
  private livroService = inject(LivroService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly itensPorPagina = 10;

  livros = signal<Livro[]>([]);
  carregando = signal(true);
  erro = signal(false);
  paginaAtual = signal(1);
  busca = signal('');
  livroEditando = signal<Livro | null>(null);
  livroParaDesativar = signal<Livro | null>(null);
  desativando = signal(false);
  erroDesativacao = signal('');

  livrosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.livros();

    return this.livros().filter(livro =>
      livro.titulo.toLowerCase().includes(termo) || livro.autor.toLowerCase().includes(termo)
    );
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.livrosFiltrados().length / this.itensPorPagina)));

  livrosPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    return this.livrosFiltrados().slice(inicio, inicio + this.itensPorPagina);
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.livroService.getAll().subscribe({
      next: (livros) => {
        this.livros.set(livros);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
  }

  paginaAnterior() {
    this.irParaPagina(this.paginaAtual() - 1);
  }

  proximaPagina() {
    this.irParaPagina(this.paginaAtual() + 1);
  }

  onBuscaChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.busca.set(valor);
    this.paginaAtual.set(1);
  }

  abrirEdicao(livro: Livro) {
    this.livroEditando.set(livro);
  }

  fecharEdicao() {
    this.livroEditando.set(null);
  }

  aoSalvarLivro(atualizado: Livro) {
    this.livros.update(lista => lista.map(l => (l.livroId === atualizado.livroId ? atualizado : l)));
    this.fecharEdicao();
  }

  pedirDesativacao(livro: Livro) {
    this.erroDesativacao.set('');
    this.livroParaDesativar.set(livro);
  }

  cancelarDesativacao() {
    if (this.desativando()) return;
    this.livroParaDesativar.set(null);
  }

  confirmarDesativacao() {
    const livro = this.livroParaDesativar();
    if (!livro) return;

    this.desativando.set(true);
    this.erroDesativacao.set('');

    this.livroService.desativarLivro(livro.livroId).subscribe({
      next: () => {
        this.livros.update(lista =>
          lista.map(l => (l.livroId === livro.livroId ? { ...l, livroStatus: false } : l))
        );
        this.desativando.set(false);
        this.livroParaDesativar.set(null);
      },
      error: () => {
        this.desativando.set(false);
        this.erroDesativacao.set('Não foi possível desativar o livro. Tente novamente.');
      },
    });
  }
}
