import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LivroService } from '../../../../core/services/livro';
import { Livro } from '../../../../core/models/livro';

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
    genero: [''],
    tags: [''],
  });

  buscandoIsbn = signal(false);
  avisoIsbn = signal('');

  capaPreview = signal<string | null>(null);
  private arquivoCapa: File | null = null;
  private objectUrl: string | null = null;

  salvando = signal(false);
  erroSalvar = signal('');

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
        });
      },
      error: () => {
        this.buscandoIsbn.set(false);
        this.avisoIsbn.set('Não encontramos um livro com esse ISBN. Preencha os dados manualmente.');
      },
    });
  }

  onArquivoSelecionado(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

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

    this.livroService.cadastrar({ ...this.form.getRawValue(), livroStatus: true }).pipe(
      switchMap((criado): Observable<Livro> =>
        this.arquivoCapa ? this.livroService.atualizarCapa(criado.livroId, this.arquivoCapa) : of(criado)
      )
    ).subscribe({
      next: () => this.router.navigateByUrl('/mostrar-livros'),
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erroSalvar.set(err.error?.mensagem ?? 'Não foi possível cadastrar o livro.');
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
