import { Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Livro } from '../../core/models/livro';
import { LivroService } from '../../core/services/livro';
import { mensagemErro } from '../../core/utils/mensagem-erro';
import { validarCapa } from '../../core/utils/validar-capa';
import { urlCapa } from '../pipes/capa.pipe';

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
    ativo: [true],
    totalExemplares: [1],
  });

  // Quantos exemplares novos serão cadastrados ao salvar (novo total − total atual)
  private totalDigitado = toSignal(this.form.controls.totalExemplares.valueChanges, { initialValue: 0 });
  exemplaresNovos = computed(() => Math.max(0, (Number(this.totalDigitado()) || 0) - this.livro().totalExemplares));

  salvando = signal(false);
  erro = signal('');
  capaPreview = signal<string | null>(null);
  erroCapa = signal('');
  removerCapaAoSalvar = signal(false);

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
      ativo: l.livroStatus === 'ATIVO',
      totalExemplares: l.totalExemplares ?? 0,
    });
    // Só dá para aumentar: o back adiciona exemplares, mas não tem rota para removê-los
    this.form.controls.totalExemplares.setValidators([
      Validators.required,
      Validators.min(l.totalExemplares ?? 0),
      Validators.pattern(/^\d+$/),
    ]);
    this.form.controls.totalExemplares.updateValueAndValidity();
    this.capaPreview.set(urlCapa(l.imgUrl));
  }

  ngOnDestroy() {
    this.revogarPreview();
  }

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
    this.removerCapaAoSalvar.set(false);
    this.objectUrl = URL.createObjectURL(file);
    this.capaPreview.set(this.objectUrl);
  }

  removerCapa() {
    this.revogarPreview();
    this.arquivoCapa = null;
    this.erroCapa.set('');
    // Só precisa chamar o back se o livro tinha uma capa salva
    this.removerCapaAoSalvar.set(!!this.livro().imgUrl);
    this.capaPreview.set(null);
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
    const { ativo, totalExemplares, ...campos } = this.form.getRawValue();
    const novos = this.exemplaresNovos();
    this.salvando.set(true);
    this.erro.set('');

    this.livroService.atualizar(id, {
      ...camposDesabilitados,
      ...campos,
      imgUrl: livro.imgUrl,
      livroStatus: ativo ? 'ATIVO' : 'INATIVO',
    }).pipe(
      // Cadastra só a diferença: de 1 para 3, adiciona 2 exemplares
      switchMap((atualizado): Observable<unknown> =>
        novos > 0 ? this.livroService.adicionarExemplares(id, novos) : of(atualizado)
      ),
      switchMap((): Observable<unknown> => {
        if (this.arquivoCapa) return this.livroService.enviarCapa(id, this.arquivoCapa);
        if (this.removerCapaAoSalvar()) return this.livroService.removerCapa(id);
        return of(null);
      }),
      // Busca o livro de novo para vir com o total e os disponíveis já atualizados
      switchMap(() => this.livroService.buscarPorId(id))
    ).subscribe({
      next: (atualizado) => this.salvo.emit(atualizado),
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemErro(err, 'Não foi possível salvar as alterações.'));
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
