import { Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Livro } from '../../core/models/livro';
import { LivroService } from '../../core/services/livro';

@Component({
  selector: 'app-editar-livro-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-livro-modal.html',
  styleUrl: './editar-livro-modal.scss',
  host: { '(document:keydown.escape)': 'fechar.emit()' },
})
export class EditarLivroModal implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private livroService = inject(LivroService);

  livro = input.required<Livro>();
  fechar = output<void>();
  salvo = output<Livro>();

  form = this.fb.nonNullable.group({
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
    livroStatus: [true],
  });

  salvando = signal(false);
  erro = signal('');
  capaPreview = signal<string | null>(null);

  private arquivoCapa: File | null = null;
  private objectUrl: string | null = null;

  ngOnInit() {
    const l = this.livro();
    this.form.patchValue({
      titulo: l.titulo ?? '',
      subtitulo: l.subtitulo ?? '',
      descricao: l.descricao ?? '',
      autor: l.autor ?? '',
      editora: l.editora ?? '',
      idioma: l.idioma ?? '',
      area: l.area ?? '',
      paginas: l.paginas ?? 0,
      ano: l.ano ?? 0,
      genero: l.genero ?? '',
      tags: l.tags ?? '',
      livroStatus: l.livroStatus ?? false,
    });
    this.capaPreview.set(l.imgUrl || null);
  }

  ngOnDestroy() {
    this.revogarPreview();
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

    const livro = this.livro();
    const id = livro.livroId;
    const camposDesabilitados = {
      isbn: livro.isbn,
      pha: livro.pha,
      dewey: livro.dewey,
    };
    this.salvando.set(true);
    this.erro.set('');

    this.livroService.atualizar(id, { ...camposDesabilitados, ...this.form.getRawValue() }).pipe(
      switchMap((atualizado): Observable<Livro> =>
        this.arquivoCapa ? this.livroService.atualizarCapa(id, this.arquivoCapa) : of(atualizado)
      )
    ).subscribe({
      next: (atualizado) => this.salvo.emit(atualizado),
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(err.error?.mensagem ?? 'Não foi possível salvar as alterações.');
      },
    });
  }

  private revogarPreview() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
