import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LivroService } from '../../../../core/services/livro';
import { Livro } from '../../../../core/models/livro';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';
import { validarCapa } from '../../../../core/utils/validar-capa';

@Component({
  selector: 'app-cadastrar-livro',
  imports: [ReactiveFormsModule, Header, Footer],
  templateUrl: './cadastrar-livro.html',
  styleUrl: './cadastrar-livro.scss',
})
export class CadastrarLivro implements OnDestroy {
  private fb = inject(FormBuilder);
  private livroService = inject(LivroService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    isbn: [''],
    pha: [''],
    dewey: [''],
    titulo: ['', Validators.required],
    subtitulo: [''],
    descricao: [''],
    autor: ['', Validators.required],
    editora: [''],
    idioma: [''],
    area: [''],
    paginas: [0, [Validators.required, Validators.min(1)]],
    ano: [0, [Validators.required, Validators.min(0)]],
    quantidadeExemplares: [1, [Validators.required, Validators.min(1)]],
    genero: [''],
    tags: [''],
  });

  buscandoIsbn = signal(false);
  avisoIsbn = signal('');

  capaPreview = signal<string | null>(null);
  erroCapa = signal('');
  private arquivoCapa: File | null = null;
  private objectUrl: string | null = null;

  salvando = signal(false);
  erroSalvar = signal('');

  // Signals adicionados para o controle das Tags (Pílulas)
  tagsList = signal<string[]>([]);
  tagEditando = signal<number | null>(null);

  cancelar() {
    this.router.navigateByUrl('/mostrar-livros');
  }

  buscarPorIsbn() {
    const isbn = this.form.controls.isbn.value.trim();
    if (!isbn) return;

    this.buscandoIsbn.set(true);
    this.avisoIsbn.set('');

    this.livroService.buscarPorIsbn(isbn).subscribe({
      next: (dados) => {
        this.buscandoIsbn.set(false);
        this.avisoIsbn.set('Dados encontrados. Confira e complete o que faltar.');

        // Processa as tags vindas da busca e as transforma em pílulas normalizadas
        if (dados.tags) {
          const tagsEncontradas = dados.tags.split(',')
            .map(t => this.normalizarTag(t))
            .filter(t => t);
          this.tagsList.set(tagsEncontradas);
        }

        this.form.patchValue({
          titulo: dados.titulo ?? this.form.controls.titulo.value,
          subtitulo: dados.subtitulo ?? this.form.controls.subtitulo.value,
          descricao: dados.descricao ?? this.form.controls.descricao.value,
          autor: dados.autor ?? this.form.controls.autor.value,
          editora: dados.editora ?? this.form.controls.editora.value,
          idioma: dados.idioma ?? this.form.controls.idioma.value,
          paginas: dados.paginas ?? this.form.controls.paginas.value,
          ano: dados.ano ?? this.form.controls.ano.value,
          genero: dados.genero ?? this.form.controls.genero.value,
          tags: this.tagsList().join(', ') // Sincroniza o array de tags com o formulário
        });
      },
      error: () => {
        this.buscandoIsbn.set(false);
        this.avisoIsbn.set('Não encontramos um livro com esse ISBN. Preencha os dados manualmente.');
      },
    });
  }

  // --- Lógica de Controle das Tags (Pílulas) ---

  onTagKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault(); // Evita o submit acidental do formulário ao dar Enter
      const input = event.target as HTMLInputElement;
      this.processarNovaTag(input.value);
      input.value = '';
    }
  }

  adicionarTagPeloInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.processarNovaTag(input.value);
    input.value = '';
  }

  private processarNovaTag(valor: string) {
    const tagNormalizada = this.normalizarTag(valor);
    if (tagNormalizada && !this.tagsList().includes(tagNormalizada)) {
      this.tagsList.update(tags => [...tags, tagNormalizada]);
      this.sincronizarForm();
    }
  }

  removerTag(index: number) {
    this.tagsList.update(tags => tags.filter((_, i) => i !== index));
    this.sincronizarForm();
  }

  iniciarEdicao(index: number) {
    this.tagEditando.set(index);
  }

  concluirEdicao(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const novoValor = this.normalizarTag(input.value);

    this.tagsList.update(tags => {
      if (novoValor && !tags.includes(novoValor)) {
        tags[index] = novoValor;
      } else {
        // Remove a tag se o texto for apagado ou se a edição gerar uma tag duplicada
        tags.splice(index, 1);
      }
      return [...tags];
    });

    this.tagEditando.set(null);
    this.sincronizarForm();
  }

  private normalizarTag(tag: string): string {
    if (!tag) return '';
    // Remove espaços duplos e espaços nas pontas
    const textoLimpo = tag.trim().replace(/\s+/g, ' ');
    if (!textoLimpo) return '';
    // Primeira letra maiúscula e o resto minúsculo
    return textoLimpo.charAt(0).toUpperCase() + textoLimpo.slice(1).toLowerCase();
  }

  private sincronizarForm() {
    this.form.controls.tags.setValue(this.tagsList().join(', '));
  }

  // --- Fim da Lógica de Tags ---

  onArquivoSelecionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const problema = validarCapa(file);
    this.erroCapa.set(problema ?? '');
    if (problema) return;

    this.revogarPreview();
    this.arquivoCapa = file;
    this.objectUrl = URL.createObjectURL(file);
    this.capaPreview.set(this.objectUrl);
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroSalvar.set('');

    this.livroService.cadastrar({ ...this.form.getRawValue(), livroStatus: 'ATIVO' }).pipe(
      switchMap((criado): Observable<Livro> =>
        this.arquivoCapa ? this.livroService.enviarCapa(criado.livroId, this.arquivoCapa) : of(criado)
      )
    ).subscribe({
      next: () => this.router.navigateByUrl('/mostrar-livros'),
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erroSalvar.set(mensagemErro(err, 'Não foi possível cadastrar o livro.'));
      },
    });
  }

  ngOnDestroy() {
    this.revogarPreview();
  }

  private revogarPreview() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
