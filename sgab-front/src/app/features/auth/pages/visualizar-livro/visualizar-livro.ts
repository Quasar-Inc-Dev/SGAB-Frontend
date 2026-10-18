import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LivroService } from '../../../../core/services/livro';
import { Livro } from '../../../../core/models/livro';

interface CampoLivro {
  key: keyof Livro;
  label: string;
  span?: boolean;
  textarea?: boolean;
}

@Component({
  selector: 'app-visualizar-livro',
  imports: [Header, Footer, RouterLink],
  templateUrl: './visualizar-livro.html',
  styleUrl: './visualizar-livro.scss',
})
export class VisualizarLivro implements OnInit {
  private route = inject(ActivatedRoute);
  private livroService = inject(LivroService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  livro = signal<Livro | null>(null);
  carregando = signal(true);
  erro = signal(false);

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
    { key: 'qtdUnidade', label: 'Qtd. unidades' },
    { key: 'tags', label: 'Tags', span: true },
    { key: 'livroStatus', label: 'Status' },
    { key: 'descricao', label: 'Descrição', span: true, textarea: true },
  ];

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.livroService.buscarPorId(id).subscribe({
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

  valor(key: keyof Livro): string {
    const v = this.livro()?.[key];
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Ativo' : 'Inativo';
    return String(v);
  }
}
