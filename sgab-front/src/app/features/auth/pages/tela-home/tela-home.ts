import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../../../../shared/header/header';
import { LivroService } from '../../../../core/services/livro';
import { Livro } from '../../../../core/models/livro';
import { Footer } from '../../../../shared/footer/footer';

@Component({
  selector: 'app-tela-home',
  imports: [Header, Footer, FormsModule],
  templateUrl: './tela-home.html',
  styleUrl: './tela-home.scss',
})
export class TelaHome implements OnInit {
  private livroService = inject(LivroService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  livros = signal<Livro[]>([]);
  carregando = signal(true);
  erro = signal(false);

  entrou = signal(false);
  saindo = signal(false);

  busca = signal('');
  generoSelecionado = signal('');
  areaSelecionada = signal('');
  filtroAberto = signal(false);

  generos = computed(() => [...new Set(this.livros().map(l => l.genero).filter(Boolean))].sort());
  areas = computed(() => [...new Set(this.livros().map(l => l.area).filter(Boolean))].sort());

  livrosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const genero = this.generoSelecionado();
    const area = this.areaSelecionada();

    return this.livros().filter(livro => {
      const bateBusca = !termo
        || livro.titulo.toLowerCase().includes(termo)
        || livro.autor.toLowerCase().includes(termo);
      const bateGenero = !genero || livro.genero === genero;
      const bateArea = !area || livro.area === area;
      return bateBusca && bateGenero && bateArea;
    });
  });

  toggleFiltro() {
    this.filtroAberto.update(v => !v);
  }

  entrar() {
    if (this.saindo()) return;
    this.saindo.set(true);
    setTimeout(() => this.entrou.set(true), 700);
  }

  limparFiltros() {
    this.busca.set('');
    this.generoSelecionado.set('');
    this.areaSelecionada.set('');
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.livroService.getAll().subscribe({
      next: (livros) => {
        this.livros.set(livros);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false)
      }
    })
  }
}
